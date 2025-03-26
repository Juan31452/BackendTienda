import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  Descripcion: { type: String, required: true },
  Cantidad: { type: Number, required: true, min: 1 },
  Precio: { type: Number, required: true, min: 0 },
  Color: { type: String, required: true },
  Talla: { type: String, required: true },
  Id: { type: String, required: true, unique: true }, // Se mantiene como String por su formato "10.23"
  Imagen: { type: String, required: true },
  Categoria: { type: String, required: true }
}, { timestamps: true });

const Products= mongoose.model('Products', productoSchema);
export default Products;