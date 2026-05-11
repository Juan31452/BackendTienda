import mongoose from 'mongoose';
import type { FilterQuery } from 'mongoose';
import { ProductQueryParams, UserPayload, IProduct } from '../types/index.ts';

/**
 * Construye el objeto de consulta de MongoDB para los productos basado en los parámetros de la solicitud y el usuario.
 * @param queryParams - Los parámetros de la consulta de la solicitud (req.query).
 * @param user - El objeto de usuario autenticado (req.user).
 * @returns El objeto de consulta (`query`) tipado para Mongoose.
 */
export const buildProductQuery = (
  queryParams: ProductQueryParams,
  user?: UserPayload
): FilterQuery<IProduct> => {
  const { categoria, estado, minPrecio, maxPrecio, vendedor } = queryParams;
  const query: FilterQuery<IProduct> = {};

  // --- LÓGICA DE FILTRADO POR VENDEDOR ---
  if (user) {
    if (user.role === 'vendedor') {
      // Si es un vendedor, SIEMPRE filtra por su propio ID.
      query.vendedor = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'admin' && vendedor && typeof vendedor === 'string' && mongoose.Types.ObjectId.isValid(vendedor)) {
      // Si es un admin y proporciona un `vendedor`, filtra por ese vendedor si es válido.
      query.vendedor = new mongoose.Types.ObjectId(vendedor);
    }
  }

  // --- FILTRO POR CATEGORÍA ---
  if (categoria && categoria !== 'undefined') {
    query.Categoria = categoria;
  }

  // --- LÓGICA DE FILTRADO POR ESTADO (SEGÚN ROL) ---
  const esUsuarioPrivilegiado = !!(user && (user.role === 'admin' || user.role === 'vendedor'));
  const estadosPublicos = ['Disponible', 'Nuevo', 'Oferta'];

  if (esUsuarioPrivilegiado) {
    // Admin/Vendedor: Si especifican un estado, se usa. Si no, ven todos.
    if (estado && estado !== 'undefined') {
      query.Estado = estado;
    }
  } else {
    // Invitados: Solo ven estados públicos.
    if (estado && typeof estado === 'string' && estadosPublicos.includes(estado)) {
      query.Estado = estado;
    } else {
      query.Estado = { $in: estadosPublicos };
    }
  }

  // --- FILTRO POR RANGO DE PRECIO ---
  if (minPrecio || maxPrecio) {
    query.Precio = {
      ...(minPrecio && { $gte: Number(minPrecio) }),
      ...(maxPrecio && { $lte: Number(maxPrecio) })
    };
  }

  return query;
};