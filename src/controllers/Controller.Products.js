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
    let { page = 1, limit = 100, categoria, estado, minPrecio, maxPrecio } = req.query;

    // 🛡 Validaciones seguras de números
    const pageNum  = Number(page);
    const limitNum = Number(limit);

    const safePage  = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1;
    const safeLimit = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 100;

    const query = {};

    // ✅ Filtros seguros
    if (categoria && categoria !== 'undefined') {
      query.Categoria = categoria;
    }

    if (estado && estado !== 'undefined') {
      query.Estado = estado;
    }

    // ✅ Filtro por rango de precio
    if (minPrecio || maxPrecio) {
      query.Precio = {};
      if (minPrecio) query.Precio.$gte = Number(minPrecio);
      if (maxPrecio) query.Precio.$lte = Number(maxPrecio);
    }

    // ✅ Consulta paginada y ordenada por IdProducto (convertido a float)
    const productos = await Producto.aggregate([
      { $match: query },
      {
        $addFields: {
          IdProductoFloat: { $toDouble: "$IdProducto" }
        }
      },
      { $sort: { IdProductoFloat: 1 } },
      { $skip: (safePage - 1) * safeLimit },
      { $limit: safeLimit }
    ]);

    const count = await Producto.countDocuments(query);

    res.status(200).json({
      success: true,
      productos,
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
    const producto = await Producto.findOne({ IdProducto: req.params.id });
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

// Obtener estadísticas de productos por categoría y estado
export const obtenerEstadisticasProductos = async (req, res) => {
  try {
    const stats = await Producto.aggregate([
      {
        $group: {
          _id: {
            Categoria: "$Categoria",
            Estado: "$Estado"
          },
          total: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.Categoria",
          conteos: {
            $push: {
              estado: "$_id.Estado",
              total: "$total"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          Categoria: "$_id",
          estados: {
            $arrayToObject: {
              $map: {
                input: "$conteos",
                as: "item",
                in: [
                  "$$item.estado",
                  "$$item.total"
                ]
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      estadisticas: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error.message
    });
  }
};

