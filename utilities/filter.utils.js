import mongoose from 'mongoose';

/**
 * Construye el objeto de consulta de MongoDB para los productos basado en los parámetros de la solicitud y el usuario.
 * @param {object} queryParams - Los parámetros de la consulta de la solicitud (req.query).
 * @param {object} user - El objeto de usuario autenticado (req.user).
 * @returns {object} El objeto de consulta (`query`) para ser usado en Mongoose/MongoDB.
 */
export const buildProductQuery = (queryParams, user) => {
  const { categoria, estado, minPrecio, maxPrecio, vendedorId } = queryParams;
  const query = {};

  // --- LÓGICA DE FILTRADO POR VENDEDOR ---
  if (user) {
    if (user.role === 'vendedor') {
      // Si es un vendedor, SIEMPRE filtra por su propio ID.
      query.vendedor = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'admin' && vendedorId) {
      // Si es un admin y proporciona un `vendedorId`, filtra por ese vendedor.
      query.vendedor = new mongoose.Types.ObjectId(vendedorId);
    }
  }

  // --- FILTRO POR CATEGORÍA ---
  if (categoria && categoria !== 'undefined') {
    query.Categoria = categoria;
  }

  // --- LÓGICA DE FILTRADO POR ESTADO (SEGÚN ROL) ---
  const esUsuarioPrivilegiado = user && (user.role === 'admin' || user.role === 'vendedor');
  const estadosPublicos = ['Disponible', 'Nuevo', 'Oferta'];

  if (esUsuarioPrivilegiado) {
    // Admin/Vendedor: Si especifican un estado, se usa. Si no, ven todos.
    if (estado && estado !== 'undefined') {
      query.Estado = estado;
    }
  } else {
    // Invitados: Solo ven estados públicos.
    if (estado && estadosPublicos.includes(estado)) {
      query.Estado = estado;
    } else {
      query.Estado = { $in: estadosPublicos };
    }
  }

  // --- FILTRO POR RANGO DE PRECIO ---
  if (minPrecio || maxPrecio) {
    query.Precio = {};
    if (minPrecio) query.Precio.$gte = Number(minPrecio);
    if (maxPrecio) query.Precio.$lte = Number(maxPrecio);
  }

  return query;
};
