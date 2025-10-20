import mongoose from 'mongoose';
import Producto from '../models/Model.Products.js';

/**
 * Formato estándar de respuesta exitosa
 */
const successResponse = (res, data, status = 200) => {
  res.status(status).json({
    success: true,
    data
  });
};

/**
 * Formato estándar de respuesta de error
 */
const errorResponse = (res, error, status = 500, details = null) => {
  res.status(status).json({
    success: false,
    error,
    ...(details && { details })
  });
};

// Obtener todos los productos con paginación
export const obtenerProductos = async (req, res) => {
  try {
    let { page = 1, limit = 100, categoria, estado, minPrecio, maxPrecio, search } = req.query;
    console.log('Usuario autenticado:', req.user);
 
    // 🛡 Validaciones seguras de números
    const pageNum  = Number(page);
    const limitNum = Number(limit);

    const safePage  = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1;
    const safeLimit = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 100;

    const query = {};

    // ✅ Filtro de búsqueda de texto (Búsqueda Semántica)
    if (search) {
      // Si hay más de una palabra, las encerramos en comillas para una búsqueda AND.
      // Si es una sola palabra, se busca normalmente.
      const terms = search.split(' ').filter(term => term);
      const searchExpression = terms.length > 1 ? terms.map(term => `"${term}"`).join(' ') : search;
      query.$text = { $search: searchExpression };
    }

    // ✅ Filtros seguros
    if (categoria && categoria !== 'undefined') {
      query.Categoria = categoria;
    }

    // --- LÓGICA DE ESTADO BASADA EN ROL (SOLUCIÓN DEFINITIVA) ---
    const esAdmin = req.user && req.user.role === 'admin';

    if (esAdmin) {
      // Si el usuario es 'admin', se respeta el filtro de estado si se proporciona.
      // Si no se envía, no se filtra por estado, permitiendo ver todos los productos.
      if (estado && estado !== 'undefined') {
        query.Estado = estado;
      }
    } else {
      // Si el usuario NO es 'admin' (invitado, cliente, etc.),
      // se fuerza a que solo vea los productos en estados públicos.
      query.Estado = { $in: ['Disponible', 'Nuevo', 'Oferta'] };
    }

    // ✅ Filtro por rango de precio
    if (minPrecio || maxPrecio) {
      query.Precio = {};
      if (minPrecio) query.Precio.$gte = Number(minPrecio);
      if (maxPrecio) query.Precio.$lte = Number(maxPrecio);
    }

    // Determinar si el usuario está autorizado para ver precios
    const puedeVerPrecios = req.user && (req.user.role === 'admin' || req.user.role === 'vendedor');
    // CORRECCIÓN: El token JWT contiene 'email', no 'username'.
    // Usamos 'email' para identificar al usuario en el log.
    console.log(`Usuario ${req.user ? req.user.email : 'anónimo'} - Puede ver precios: ${puedeVerPrecios}`);
    
    // Construcción del pipeline de agregación
    const pipeline = [
      { $match: query },
      {
        $facet: {
          productos: [
            ...(search
              ? [
                  // ✅ CORRECCIÓN: Usar $addFields es más seguro para añadir el score sin perder campos.
                  { $addFields: { score: { $meta: "textScore" } } },
                  { $sort: { score: -1 } }
                ]
              : [
                  { $addFields: { IdProductoFloat: { $toDouble: "$IdProducto" } } },
                  { $sort: { IdProductoFloat: 1 } }
                ]
            ),
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
    const productosFinales = productos.map(p => {
      const productoObjeto = p.toObject ? p.toObject() : p; // Convertimos a objeto plano
      const { Precio, ...restoDelProducto } = productoObjeto;
      // Si el usuario puede ver precios Y el precio existe, lo incluimos.
      // De lo contrario, solo enviamos el resto de los campos.
      return puedeVerPrecios && Precio !== undefined ? p : restoDelProducto;
    });

    res.status(200).json({
      success: true,
      productos: productosFinales,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / safeLimit),
        currentPage: safePage,
        itemsPerPage: safeLimit
      }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los productos',
      error: error.message
    });
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
    
    const { IdProducto, Descripcion, Precio } = req.body;
    
    if (!IdProducto || !Descripcion || !Precio) {
      return errorResponse(res, 'IdProducto, Descripcion y Precio son campos requeridos', 400);
    }

    const existeProducto = await Producto.findOne({ IdProducto });
    if (existeProducto) {
      return errorResponse(res, 'Ya existe un producto con este IdProducto', 400);
    }

    const nuevoProducto = new Producto(req.body);
    const productoGuardado = await nuevoProducto.save();
    
    successResponse(res, productoGuardado, 201);
  } catch (error) {
    errorResponse(res, 'Error al crear el producto', 400, error.message);
  }
};

// Crear múltiples productos
export const crearProductos = async (req, res) => {
  try {
    
    const productos = req.body;

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

    // 1. Si hay un término de búsqueda, lo añadimos como primera etapa del pipeline.
    // Esto filtra los documentos ANTES de la agrupación.
    if (search) {
      pipeline.push({ $match: { $text: { $search: search } } });
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