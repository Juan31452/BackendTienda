import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  Descripcion: { type: String, required: true },
  Cantidad: { type: Number, required: true, min: 1 },
  Precio: { type: Number, required: true, min: 0 },
  Color: { type: String, required: true },
  Talla: { type: String, required: true },
  IdProducto: { type: String, required: true, unique: true }, // Se mantiene como String por su formato "10.23"
  Imagen: { type: String, required: true },
  Categoria: { type: String, required: true },
  Estado: { type: String, required: true },
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// ✅ Índice de texto para búsqueda semántica (Búsqueda Inteligente)
// Esto le indica a MongoDB que cree un índice especial que permite búsquedas
// de texto eficientes en los campos especificados.
productoSchema.index({
  Descripcion: 'text',
  Categoria: 'text',
  Color: 'text'
});

const Products = mongoose.model('Products', productoSchema);
export default Products;