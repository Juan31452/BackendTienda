import mongoose, { Schema, Document } from 'mongoose';

// Sub-esquema para los ítems individuales dentro del carrito
export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number; // Precio del producto en el momento de añadirlo al carrito
  quantity: number;
}

const CartItemSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Products', required: true },
  name: { type: String, required: true },
  image: { type: String, required: false },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

// Esquema principal del carrito
export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // Un carrito por usuario
  items: [CartItemSchema],
  totalPrice: { type: Number, required: true, default: 0 },
}, {
  timestamps: true,
});

// Pre-save hook para calcular el totalPrice
CartSchema.pre('save', function(next) {
  this.totalPrice = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  next();
});

export default mongoose.model<ICart>('Cart', CartSchema);
