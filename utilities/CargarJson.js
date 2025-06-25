import fs from 'fs';
import path from 'path';

const carpetaJson = './data'; // Carpeta donde están tus archivos JSON

// Función para cargar y combinar todos los JSON de la carpeta
function cargarTodosLosJson(rutaCarpeta) {
  const archivos = fs.readdirSync(rutaCarpeta);
  const objetos = [];

  archivos.forEach((archivo) => {
    if (archivo.endsWith('.json')) {
      const rutaCompleta = path.join(rutaCarpeta, archivo);
      const contenido = fs.readFileSync(rutaCompleta, 'utf-8');

      try {
        const data = JSON.parse(contenido);

        if (Array.isArray(data)) {
          objetos.push(...data); // Si es un array, agregamos todos
        } else {
          objetos.push(data); // Si es un objeto, lo agregamos solo
        }
      } catch (error) {
        console.error(`❌ Error al leer ${archivo}: ${error.message}`);
      }
    }
  });

  return objetos;
}

// Usar la función
const datosCargados = cargarTodosLosJson(carpetaJson);
console.log('✅ Datos combinados:', datosCargados);
