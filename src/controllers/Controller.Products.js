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
    const { page = 1, limit = 100, categoria, estado, minPrecio, maxPrecio } = req.query;
    const query = {};
    
    // 🎯 Filtro insensible a mayúsculas
    if (categoria) query.Categoria = new RegExp(`^${categoria}$`, 'i');
    if (estado) query.Estado = new RegExp(`^${estado}$`, 'i');

    // Construir query dinámico
    if (categoria) query.Categoria = categoria;
    if (estado) query.Estado = estado;
    if (minPrecio || maxPrecio) {
      query.Precio = {};
      if (minPrecio) query.Precio.$gte = Number(minPrecio);
      if (maxPrecio) query.Precio.$lte = Number(maxPrecio);
    }

     const productos = await Producto.aggregate([
      { $match: query },
      {
        $addFields: {
          IdProductoFloat: { $toDouble: "$IdProducto" }
        }
      },
      { $sort: { IdProductoFloat: 1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    ]);

    const count = await Producto.countDocuments(query);

    // Respuesta directa con Express
    res.status(200).json({
      success: true,
      productos,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page),
        itemsPerPage: Number(limit)
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
