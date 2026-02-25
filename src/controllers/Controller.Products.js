import mongoose from 'mongoose';
import Producto from '../models/Model.Products.js';
import { buildProductQuery } from '../../utilities/filter.utils.js'; // filtros reutilizables
import { applySemanticSearch } from '../../services/searchService.js';
import { successResponse, errorResponse } from '../../utilities/respuestas.js';

// Obtener todos los productos con paginación
export const obtenerProductos = async (req, res) => {
  try {
    let { page = 1, limit = 100, search, sort } = req.query;
    console.log('Usuario autenticado:', req.user);

    // 🛡 Validaciones seguras de números
    const pageNum  = Number(page);
    const limitNum = Number(limit);

    const safePage  = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1;
    const safeLimit = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 100;

    // Construimos el objeto de consulta usando filteros reutilizables
    const query = buildProductQuery(req.query, req.user);

    // --- 🔒 Filtrado por Rol: Vendedor solo ve lo suyo ---
    if (req.user) {
      if (req.user.role === 'vendedor') {
        query.vendedor = new mongoose.Types.ObjectId(req.user.id);
      } else if (req.user.role === 'admin' && req.query.vendedor) {
        if (mongoose.Types.ObjectId.isValid(req.query.vendedor)) {
          query.vendedor = new mongoose.Types.ObjectId(req.query.vendedor);
        }
      }
    }

    // --- ✅ Lógica de Ordenación Flexible ---
    let sortStages = [];
    if (search) {
      // Si hay una búsqueda, el servicio de búsqueda puede definir su propia ordenación (ej. por relevancia)
      ({ sortStages } = applySemanticSearch(query, search, req.user));
    }

    // Si la búsqueda no definió una ordenación, o no hay búsqueda, aplicamos la ordenación del usuario
    if (sortStages.length === 0) {
      // Lógica de ordenación simplificada a 'newest' y 'oldest'
      switch (sort) {
        case 'oldest': // Más antiguos primero
          sortStages.push({ $sort: { createdAt: 1 } });
          break;
        default: // 'newest' o cualquier otro valor será el orden por defecto
          sortStages.push({ $sort: { createdAt: -1 } });
      }
    }

    
    // Construcción del pipeline de agregación
    const pipeline = [
      { $match: query },
      {
        $facet: {
          productos: [
            ...sortStages,
            { $skip: (safePage - 1) * safeLimit },
            { $limit: safeLimit },
          ],
          totalItems: [
            { $count: 'count' }
          ]
        }
      }
    ];

    // ✅ Consulta paginada y ordenada por IdProducto (convertido a float)
    // Usamos $facet para ejecutar dos pipelines en paralelo: uno para los datos y otro para el conteo total.
    // Esto nos ahorra una consulta a la base de datos.
    const results = await Producto.aggregate(pipeline);

    let productos = results[0].productos;
    const count = results[0].totalItems.length > 0 ? results[0].totalItems[0].count : 0;

    // ✅ SOLUCIÓN DEFINITIVA: Mapeamos los productos para construir la respuesta final.
    // Esto nos da control total sobre los campos que se envían al cliente.
    const productosFinales = productos;

    const responsePayload = {
      success: true,
      productos: productosFinales,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
        currentPage: safePage,
        itemsPerPage: safeLimit
      }
    };

    res.status(200).json(responsePayload);

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los productos',
      error: error.message
    });
  }
};

/**
 * Endpoint de utilidad para administradores.
 * Asigna un vendedor a todos los productos que no tengan uno.
 * Busca al primer usuario con rol 'vendedor' y lo asigna.
 */
export const asignarVendedorGlobal = async (req, res) => {
  // 1. Verificación de permisos: Solo para administradores.
  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Acción no autorizada. Se requiere rol de administrador.', 403);
  }

  try {
    // 2. Buscar al usuario vendedor.
    const vendedor = await mongoose.model('User').findOne({ role: 'vendedor' });

    if (!vendedor) {
      return errorResponse(res, 'No se encontró ningún usuario con el rol "vendedor" en la base de datos.', 404);
    }

    // 3. Actualizar todos los productos donde el campo 'vendedor' no exista.
    // Esto evita sobrescribir productos que ya tengan un vendedor asignado.
    const resultado = await Producto.updateMany(
      { vendedor: { $exists: false } }, // El filtro
      { $set: { vendedor: vendedor._id } } // La actualización
    );

    // 5. Enviar una respuesta exitosa.
    successResponse(res, {
      message: `Operación completada. Se asignó el vendedor "${vendedor.name}" a ${resultado.modifiedCount} productos.`,
      vendedorAsignado: {
        id: vendedor._id,
        name: vendedor.name
      }
    });

  } catch (error) {
    errorResponse(res, 'Error durante la asignación masiva de vendedor.', 500, error.message);
  }
};


// Obtener un producto por ID
export const obtenerProductoPorId = async (req, res) => {
  try {
    // Se corrige el error de sintaxis: 'producto' estaba declarado dos veces.
    const producto = await Producto.findOne({ IdProducto: req.params.id }).lean();
    if (!producto) {
      return errorResponse(res, 'Producto no encontrado', 404);
    }
    successResponse(res, producto);
  } catch (error) {
    errorResponse(res, 'Error al obtener el producto', 500, error.message);
  }
};

// Crear un nuevo producto
export const crearProducto = async (req, res) => {
  try {
    const { IdProducto, Descripcion, Precio, vendedor: vendedorIdFromBody } = req.body;
    const { id: solicitanteId, role: solicitanteRole } = req.user;
    
    if (!IdProducto || !Descripcion || !Precio) {
      return errorResponse(res, 'IdProducto, Descripcion y Precio son campos requeridos', 400);
    }

    let finalVendedorId;

    if (solicitanteRole === 'admin') {
      if (!vendedorIdFromBody) {
        return errorResponse(res, 'Como administrador, debe especificar el ID del vendedor en el campo "vendedor".', 400);
      }
      // Aquí podrías añadir una validación para asegurar que el ID del vendedor existe en la DB.
      finalVendedorId = vendedorIdFromBody;
    } else if (solicitanteRole === 'vendedor') {
      finalVendedorId = solicitanteId; // El vendedor se asigna a sí mismo.
    } else {
      return errorResponse(res, 'No tiene permisos para crear productos.', 403);
    }

    const existeProducto = await Producto.findOne({ IdProducto });
    if (existeProducto) {
      return errorResponse(res, 'Ya existe un producto con este IdProducto', 400);
    }
    const nuevoProducto = new Producto({
      ...req.body,
      vendedor: finalVendedorId
    });

    const productoGuardado = await nuevoProducto.save();

    successResponse(res, productoGuardado, 201);
  } catch (error) {
    errorResponse(res, 'Error al crear el producto', 400, error.message);
  }
};

// Crear múltiples productos
export const crearProductos = async (req, res) => {
  try {
    const { id: solicitanteId, role: solicitanteRole } = req.user;
    let productos = req.body;

    if (solicitanteRole === 'admin') {
      // El admin debe especificar el vendedor en CADA producto del array.
      // Verificamos si algún producto no tiene el campo 'vendedor'.
      const algunProductoSinVendedor = productos.some(p => !p.vendedor);
      if (algunProductoSinVendedor) {
        return errorResponse(res, 'Como administrador, cada producto en el array debe tener un campo "vendedor" con el ID correspondiente.', 400);
      }
      // Si todos tienen vendedor, la data ya es correcta.
    } else if (solicitanteRole === 'vendedor') {
      // Si es un vendedor, asignamos su ID a todos los productos, ignorando cualquier 'vendedor' que venga en el body.
      productos = productos.map(p => ({
        ...p,
        vendedor: solicitanteId
      }));
    } else {
      return errorResponse(res, 'No tiene permisos para crear productos.', 403);
    }
    
    if (!Array.isArray(productos)) {  // Corrección aquí
      return errorResponse(res, 'El body debe ser un array de productos', 400);
    }
    if (productos.length === 0) {
      return errorResponse(res, 'El array de productos está vacío', 400);
    }

    const ids = productos.map(p => p.IdProducto);
    const idsUnicos = [...new Set(ids)];
    if (ids.length !== idsUnicos.length) {
      return errorResponse(res, 'Hay IDs duplicados en la solicitud', 400);
    }

    const productosExistentes = await Producto.find({ IdProducto: { $in: idsUnicos } });
    if (productosExistentes.length > 0) {
      return errorResponse(
        res,
        `Los siguientes IDs ya existen: ${productosExistentes.map(p => p.IdProducto).join(', ')}`,
        400
      );
    }

    const session = await mongoose.startSession();
    if (!session) {
      return errorResponse(res, 'No se pudo iniciar la transacción', 500);
    }

    session.startTransaction();
    try {
      const productosGuardados = await Producto.insertMany(productos, { session });
      await session.commitTransaction();
      successResponse(res, productosGuardados, 201);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    errorResponse(
      res, 
      'Error al crear los productos', 
      error.name === 'ValidationError' ? 400 : 500, 
      error.message
    );
  }
};

// Actualizar un producto por ID
export const actualizarProducto = async (req, res) => {
  try {
    
    if (Object.keys(req.body).length === 0) {  // Nueva validación
      return errorResponse(res, 'No hay datos para actualizar', 400);
    }

    const productoActualizado = await Producto.findOneAndUpdate(
      { IdProducto: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!productoActualizado) {
      return errorResponse(res, 'Producto no encontrado', 404);
    }
    
    successResponse(res, productoActualizado);
  } catch (error) {
    errorResponse(res, 'Error al actualizar el producto', 400, error.message);
  }
};

// Eliminar un producto por ID
export const eliminarProducto = async (req, res) => {
  try {

    const productoEliminado = await Producto.findOneAndDelete({ IdProducto: req.params.id });
    
    if (!productoEliminado) {
      return errorResponse(res, 'Producto no encontrado', 404);
    }
    
    successResponse(res, { 
      message: 'Producto eliminado con éxito',
      id: req.params.id 
    });
  } catch (error) {
    errorResponse(res, 'Error al eliminar el producto', 500, error.message);
  }
};

// Obtener estadísticas de productos por categoría y estado (normalizado)
export const obtenerEstadisticasProductos = async (req, res) => {
  try {
    const { search } = req.query;
    const pipeline = [];
    const matchQuery = {};

    // --- 🔒 Filtrado por Rol: Vendedor solo ve lo suyo ---
    if (req.user) {
      if (req.user.role === 'vendedor') {
        matchQuery.vendedor = new mongoose.Types.ObjectId(req.user.id);
      } else if (req.user.role === 'admin' && req.query.vendedor) {
        if (mongoose.Types.ObjectId.isValid(req.query.vendedor)) {
          matchQuery.vendedor = new mongoose.Types.ObjectId(req.query.vendedor);
        }
      }
    }

    // 1. Si hay un término de búsqueda, lo añadimos al filtro.
    if (search) {
      matchQuery.$text = { $search: search };
    }

    if (Object.keys(matchQuery).length > 0) {
      pipeline.push({ $match: matchQuery });
    }

    // 2. Añadimos la etapa de agrupación al pipeline.
    const resultados = await Producto.aggregate([
      ...pipeline, // <-- Se aplica el filtro de búsqueda aquí si existe
      {
        $group: {
          _id: { Categoria: "$Categoria", Estado: "$Estado" },
          total: { $sum: 1 }
        }
      }
    ]);

    // --- Procesamos en Node para agrupar por categoría ---
    const estadisticasMap = {};

    resultados.forEach(r => {
      const categoria = (r._id.Categoria || "Sin categoría").trim();
      const estado = (r._id.Estado || "Desconocido").trim();

      // Si la categoría no existe en el mapa, la inicializamos
      if (!estadisticasMap[categoria]) {
        estadisticasMap[categoria] = {
          Categoria: categoria,
          estados: {} // ✅ Usamos un objeto para los estados
        };
      }
      // Añadimos o sumamos el total para el estado correspondiente
      estadisticasMap[categoria].estados[estado] = (estadisticasMap[categoria].estados[estado] || 0) + r.total;
    });

    // Convertimos el mapa de objetos a un array de valores
    const estadisticas = Object.values(estadisticasMap);

    // --- Calcular "Todos" sumando dinámicamente los estados ---
    const totalesPorEstado = estadisticas.reduce((acc, cat) => {
      Object.entries(cat.estados).forEach(([estado, valor]) => {
        acc[estado] = (acc[estado] || 0) + valor;
      });
      return acc;
    }, {});

    // Insertamos el total general al inicio
    estadisticas.unshift({
      Categoria: "Todos",
      estados: totalesPorEstado
    });

    res.status(200).json({
      success: true,
      estadisticas
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las estadísticas",
      error: error.message
    });
  }
};



// Calcular total de ventas y cantidad de productos vendidos en un mes específico, opcionalmente filtrado por estado
export const getTotalMes = async (req, res) => {
  try {
    const { año, mes, estado } = req.params;

    const mesInt = parseInt(mes, 10);
    const añoInt = parseInt(año, 10);

    if (isNaN(mesInt) || isNaN(añoInt) || mesInt < 1 || mesInt > 12) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos. Mes debe ser 1-12 y año numérico.'
      });
    }

    const startDate = new Date(Date.UTC(añoInt, mesInt - 1, 1));
    const endDate = new Date(Date.UTC(añoInt, mesInt, 1));

    const matchQuery = {
      updatedAt: { $gte: startDate, $lt: endDate },
      ...(estado ? { Estado: estado } : {})
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

    const total = resultado[0] || { totalPrecio: 0, totalVentas: 0, cantidadProductos: 0 };

    res.json({
      success: true,
      data: total,
      mes: mesInt,
      año: añoInt,
      estado: estado || 'Todos',
      rangoFechas: {
        inicio: startDate.toISOString(),
        fin: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error en getTotalMes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular total del mes',
      error: error.message
    });
  }
};