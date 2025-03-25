import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

const LOCAL_URI = process.env.MONGODB_URI;
const ATLAS_URI = process.env.MONGODB_ATLAS;

class MongoConnection {
  constructor() {
    this.connection = null;
  }

  async connect(useAtlas = false) {
    if (mongoose.connection.readyState) {
      console.log('⚡ Conexión ya establecida con MongoDB.');
      return mongoose.connection;
    }

    const uri = useAtlas ? ATLAS_URI : LOCAL_URI;
    if (!uri) {
      throw new Error('❌ No se encontró la URL de conexión en las variables de entorno.');
    }

    try {
      this.connection = await mongoose.connect(uri); // ❌ Se eliminan opciones obsoletas
        console.log(`✅ Conexión exitosa a MongoDB ${useAtlas ? 'Atlas' : 'Local'}`);
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ Conexión a MongoDB perdida. Intentando reconectar...');
            this.reconnect();
        });

        return this.connection;
    } catch (error) {
        console.error(`❌ Error al conectar a MongoDB (${useAtlas ? 'Atlas' : 'Local'}):`, error);
        throw error;
    }
}

  async reconnect() {
    setTimeout(() => {
      console.log('🔄 Intentando reconectar a MongoDB...');
      this.connect();
    }, 5000); // Intentar reconectar después de 5 segundos
  }

  async disconnect() {
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
      console.log('🛑 Conexión a MongoDB cerrada.');
    }
  }
}

// Crear una instancia única (Singleton)
const mongoInstance = new MongoConnection();

export default mongoInstance;
