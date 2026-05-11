import mongoose from 'mongoose';
import Producto from '../models/Model.Products.ts';
import { buildProductQuery } from '../utilities/filter.utils.ts'; 
import { applySemanticSearch } from './searchService.ts'; 
import { UserPayload, IProduct, ProductQueryParams } from '../types/index.ts';

export const getProductsFiltered = async (params: ProductQueryParams, user?: UserPayload) => {
  const { page = 1, limit = 100, search, sort, vendedor: queryVendedor } = params;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const safePage = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1;
  const safeLimit = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 100;

  // Delega toda la construcción del filtro al utility para mantener el servicio limpio
  const query = buildProductQuery({ ...params, vendedor: queryVendedor }, user);

  let sortStages: any[] = [];
  if (search) {
    ({ sortStages } = applySemanticSearch(query, search, user));
  }

  if (sortStages.length === 0) {
    sortStages.push({ $sort: { createdAt: sort === 'oldest' ? 1 : -1 as 1 | -1 } });
  }

  const pipeline = [
    { $match: query },
    {
      $facet: {
        productos: [
          ...sortStages,
          { $skip: (safePage - 1) * safeLimit },
          { $limit: safeLimit },
        ],
        totalItems: [{ $count: 'count' }]
      }
    }
  ];

  const results = await Producto.aggregate<{ productos: IProduct[], totalItems: { count: number }[] }>(pipeline);
  const productos = results[0]?.productos || [];
  const count = results[0]?.totalItems.length > 0 ? results[0].totalItems[0].count : 0;

  return {
    productos,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / safeLimit),
      currentPage: safePage,
      itemsPerPage: safeLimit
    }
  };
};

export const createMultipleProductsService = async (productosData: Partial<IProduct>[], user: UserPayload) => {
  const { id: solicitanteId, role: solicitanteRole } = user;
  let productos = productosData;

  if (solicitanteRole === 'admin') {
    if (productos.some(p => !p.vendedor)) {
      throw new Error('Como administrador, cada producto debe tener un campo "vendedor".');
    }
  } else if (solicitanteRole === 'vendedor') {
    productos = productos.map(p => ({ ...p, vendedor: new mongoose.Types.ObjectId(solicitanteId) }));
  } else {
    throw new Error('No tiene permisos para crear productos.');
  }

  if (!Array.isArray(productos) || productos.length === 0) {
    throw new Error('El body debe ser un array de productos no vacío.');
  }

  const ids = productos.map(p => p.IdProducto).filter(Boolean) as string[];
  const idsUnicos = [...new Set(ids)];
  if (ids.length !== idsUnicos.length) throw new Error('Hay IDs duplicados en la solicitud');

  const productosExistentes = await Producto.find({ IdProducto: { $in: idsUnicos } }).lean();
  if (productosExistentes.length > 0) {
    throw new Error(`Los siguientes IDs ya existen: ${productosExistentes.map(p => p.IdProducto).join(', ')}`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const productosGuardados = await Producto.insertMany(productos, { session });
    await session.commitTransaction();
    return productosGuardados;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getProductStatsService = async (search?: string, user?: UserPayload, queryVendedor?: string) => {
  const matchQuery: any = {};

  if (user) {
    if (user.role === 'vendedor') {
      matchQuery.vendedor = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'admin' && queryVendedor) {
      if (mongoose.Types.ObjectId.isValid(queryVendedor)) {
        matchQuery.vendedor = new mongoose.Types.ObjectId(queryVendedor);
      }
    }
  }

  if (search) matchQuery.$text = { $search: search as string };

  const resultados = await Producto.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { Categoria: "$Categoria", Estado: "$Estado" },
        total: { $sum: 1 }
      }
    }
  ]);

  interface CategoriaStat {
    Categoria: string;
    estados: { [key: string]: number };
  }

  const estadisticasMap: { [key: string]: CategoriaStat } = {};
  resultados.forEach(r => {
    const categoria = (r._id.Categoria || "Sin categoría").trim();
    const estado = (r._id.Estado || "Desconocido").trim();
    if (!estadisticasMap[categoria]) {
      estadisticasMap[categoria] = { Categoria: categoria, estados: {} };
    }
    estadisticasMap[categoria].estados[estado] = (estadisticasMap[categoria].estados[estado] || 0) + r.total;
  });

  const estadisticas = Object.values(estadisticasMap);
  const totalesPorEstado = estadisticas.reduce((acc: { [key: string]: number }, cat) => {
    Object.entries(cat.estados).forEach(([estado, valor]) => {
      acc[estado] = (acc[estado] || 0) + valor;
    });
    return acc;
  }, {});

  estadisticas.unshift({ Categoria: "Todos", estados: totalesPorEstado });
  return estadisticas;
};

export const getMonthlyTotalService = async (year: string, month: string, status?: string) => {
  const mesInt = parseInt(month, 10);
  const añoInt = parseInt(year, 10);

  if (isNaN(mesInt) || isNaN(añoInt) || mesInt < 1 || mesInt > 12) {
    throw new Error('Parámetros inválidos. Mes debe ser 1-12 y año numérico.');
  }

  const startDate = new Date(Date.UTC(añoInt, mesInt - 1, 1));
  const endDate = new Date(Date.UTC(añoInt, mesInt, 1));

  const matchQuery: any = {
    updatedAt: { $gte: startDate, $lt: endDate },
    ...(status ? { Estado: status } : {})
  };

  const resultado = await Producto.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalPrecio: { $sum: { $multiply: ["$Cantidad", "$Precio"] } },
        totalVentas: { $sum: "$Cantidad" },
        cantidadProductos: { $sum: 1 }
      }
    }
  ]);

  return {
    total: resultado[0] || { totalPrecio: 0, totalVentas: 0, cantidadProductos: 0 },
    startDate,
    endDate
  };
};
