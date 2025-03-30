import Producto from '../models/Model.Products.js';

// Obtener todos los productos
export const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find();
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
};

// Obtener un producto por ID
export const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findOne({ IdProducto: req.params.id });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el producto', detalles: error.message });
  }
};

// Obtener productos por categoría
export const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const categoria = req.params.categoria;
    const productos = await Producto.find({ Categoria: categoria });

    if (productos.length === 0) {
      return res.status(404).json({ mensaje: 'No hay productos en esta categoría' });
    }

    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos por categoría', error });
  }
};

// Crear un nuevo producto
export const crearProducto = async (req, res) => {
  try {
    const { Descripcion, Cantidad, Precio, Color, Talla, IdProducto, Imagen, Categoria, Estado } = req.body;

    // Verificar si ya existe un producto con el mismo IdProducto
    const existeProducto = await Producto.findOne({ IdProducto });
    if (existeProducto) {
      return res.status(400).json({ error: 'Ya existe un producto con este IdProducto' });
    }

    const nuevoProducto = new Producto({ Descripcion, Cantidad, Precio, Color, Talla, IdProducto, Imagen, Categoria, Estado });
    const productoGuardado = await nuevoProducto.save();
    res.status(201).json(productoGuardado);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el producto', detalles: error.message });
  }
};

// Crear múltiples productos
export const crearProductos = async (req, res) => {
  try {
    const productos = req.body;

    // Validar que productos sea un array y no esté vacío
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de productos no vacío' });
    }

    // Insertar los productos en la base de datos
    const productosGuardados = await Producto.insertMany(productos);
    res.status(201).json(productosGuardados);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear los productos', detalles: error.message });
  }
};

// Actualizar un producto por ID
export const actualizarProducto = async (req, res) => {
  try {
    const productoActualizado = await Producto.findOneAndUpdate(
      { IdProducto: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!productoActualizado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar el producto', detalles: error.message });
  }
};


// Eliminar un producto por ID
export const eliminarProducto = async (req, res) => {
  try {
    const productoEliminado = await Producto.findOneAndDelete({ IdProducto: req.params.id });
    if (!productoEliminado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(200).json({ mensaje: 'Producto eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto', detalles: error.message });
  }
};

