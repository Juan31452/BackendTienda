/**
 * @fileoverview Servicio para encapsular la lógica de búsqueda de productos.
 */

/**
 * Aplica la lógica de búsqueda semántica a una consulta de MongoDB.
 * Modifica el objeto de consulta y devuelve las etapas de pipeline para la ordenación.
 *
 * @param {object} query - El objeto de consulta de Mongoose que se modificará.
 * @param {string} searchTerm - El término de búsqueda proporcionado por el usuario.
 * @param {object} user - El objeto de usuario autenticado (si existe).
 * @returns {{ sortStages: object[] }} - Un objeto que contiene las etapas del pipeline para la ordenación.
 */
export const applySemanticSearch = (query, searchTerm, user) => {
  // 1. Añadir el filtro de texto a la consulta principal.
  query.$text = { $search: searchTerm };

  // 2. Restringir la búsqueda a estados públicos para usuarios no privilegiados.
  const esUsuarioPrivilegiado = user && (user.role === 'admin' || user.role === 'vendedor');
  if (!esUsuarioPrivilegiado) {
    query.Estado = { $in: ['Disponible', 'Nuevo', 'Oferta'] };
  }

  // 3. Devolver las etapas del pipeline para ordenar por relevancia (score).
  return {
    sortStages: [
      { $addFields: { score: { $meta: 'textScore' } } },
      { $sort: { score: -1 } },
    ],
  };
};
