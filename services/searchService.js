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
  // 1. Dividimos el término de búsqueda en palabras individuales, ignorando espacios extra.
  const words = searchTerm.split(' ').filter(word => word.length > 0);

  // 2. Creamos un array de condiciones, donde cada condición es una expresión regular
  // para una palabra. La 'i' hace que la búsqueda no distinga mayúsculas/minúsculas.
  const regexConditions = words.map(word => ({
    Descripcion: { $regex: word, $options: 'i' }
  }));

  // 3. Usamos $and para asegurar que la descripción del producto contenga TODAS las palabras buscadas.
  // Si no hay condiciones (búsqueda vacía), no se añade nada.
  if (regexConditions.length > 0) {
    query.$and = regexConditions;
  }

  // 4. La búsqueda SIEMPRE debe mostrar solo productos comercializables.
  // Este filtro se aplica para TODOS los usuarios, garantizando consistencia en los resultados de búsqueda.
  query.Estado = { $in: ['Disponible', 'Nuevo', 'Oferta'] };

  return {
    //  Ordenamos por defecto.
    sortStages: [],
  };
};
