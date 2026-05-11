/**
 * Aplica la lógica de búsqueda semántica a una consulta de MongoDB.
 */
export const applySemanticSearch = (query: any, searchTerm: string, _user?: any) => {
  const words = searchTerm.split(' ').filter(word => word.length > 0);

  const regexConditions = words.map(word => ({
    Descripcion: { $regex: word, $options: 'i' }
  }));

  if (regexConditions.length > 0) {
    query.$and = regexConditions;
  }

  // Solo productos comercializables en búsqueda
  query.Estado = { $in: ['Disponible', 'Nuevo', 'Oferta'] };

  return { sortStages: [] };
};
