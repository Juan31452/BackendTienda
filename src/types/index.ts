import { Request } from 'express';
import { Types } from 'mongoose';

export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'vendedor' | 'cliente';
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface IProduct {
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

export interface ProductQueryParams {
  page?: string | number;
  limit?: string | number;
  search?: string;
  sort?: string;
  vendedor?: string;
  [key: string]: any;
}
