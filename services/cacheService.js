import NodeCache from 'node-cache';

// Creamos una instancia de caché.
// stdTTL: Tiempo de vida estándar en segundos para cada entrada. 300s = 5 minutos.
// checkperiod: Cada cuántos segundos se revisan y eliminan las entradas expiradas.
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

/**
 * Obtiene un valor de la caché.
 * @param {string} key - La clave única para el dato.
 * @returns {any | undefined} El dato cacheado o undefined si no existe.
 */
export const getFromCache = (key) => {
  const data = cache.get(key);
  if (data) console.log(`[CACHE] HIT para la clave: ${key}`);
  else console.log(`[CACHE] MISS para la clave: ${key}`);
  return data;
};

/**
 * Guarda un valor en la caché.
 * @param {string} key - La clave única para el dato.
 * @param {any} value - El valor a cachear.
 */
export const setInCache = (key, value) => {
  console.log(`[CACHE] SET para la clave: ${key}`);
  cache.set(key, value);
};

/**
 * Invalida todas las entradas de caché que comienzan con el prefijo "productos:".
 */
export const invalidateProductsCache = () => {
  const productKeys = cache.keys().filter(k => k.startsWith('productos:'));
  if (productKeys.length > 0) {
    cache.del(productKeys);
    console.log(`[Cache] Invalidadas ${productKeys.length} entradas de productos.`);
  }
};
