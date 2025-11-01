// services/cacheService.js (o un nombre similar)

// Usamos un Map para la caché. Las claves serán strings y los valores, los resultados de la API.
const cache = new Map();

// Tiempo de vida de la caché en milisegundos (ej: 5 minutos)
const CACHE_TTL = 5 * 60 * 1000; 

/**
 * Obtiene un valor de la caché si existe y no ha expirado.
 * @param {string} key - La clave única para la entrada de caché.
 * @returns {any | null} - El valor cacheado o null si no existe o ha expirado.
 */
export const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`[CACHE] HIT para la clave: ${key}`);
    return cached.data;
  }
  console.log(`[CACHE] MISS para la clave: ${key}`);
  cache.delete(key); // Limpiamos la entrada expirada
  return null;
};

/**
 * Guarda un valor en la caché con una marca de tiempo.
 * @param {string} key - La clave única para la entrada de caché.
 * @param {any} data - Los datos a cachear.
 */
export const setInCache = (key, data) => {
  console.log(`[CACHE] SET para la clave: ${key}`);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};
