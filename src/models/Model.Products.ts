import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  Descripcion: string;
  Cantidad: number;
  Precio: number;
  Color: string;
  Talla: string;
  IdProducto: string;
  Imagen: string;
  Categoria: string;
  Estado: string;
  vendedor: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const productoSchema = new Schema<IProduct>({
  Descripcion: { type: String, required: true },
  Cantidad: { type: Number, required: true, min: 1 },
  Precio: { type: Number, required: true, min: 0 },
  Color: { type: String, required: true },
  Talla: { type: String, required: true },
  IdProducto: { type: String, required: true, unique: true },
  Imagen: { type: String, required: true },
  Categoria: { type: String, required: true },
  Estado: { type: String, required: true },
  vendedor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

productoSchema.index({
  Descripcion: 'text',
  Categoria: 'text',
  Color: 'text'
});

export default mongoose.model<IProduct>('Products', productoSchema);
