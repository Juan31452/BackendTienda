import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const LOCAL_URI = process.env.MONGODB_URI;
const ATLAS_URI = process.env.MONGODB_ATLAS;

class MongoConnection {
  constructor() {
    this.connection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect(useAtlas = false) {
    if (mongoose.connection.readyState === 1) {
      console.log('⚡ Conexión ya establecida con MongoDB.');
      return mongoose.connection;
    }

    const uri = useAtlas ? ATLAS_URI : LOCAL_URI;
    if (!uri) {
      throw new Error('❌ No se encontró la URL de conexión en las variables de entorno.');
    }

    // Validación básica de URI
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error('❌ Formato de URI de MongoDB inválido');
    }

    try {
      const options = {
        serverSelectionTimeoutMS: 5000, // 5 segundos para selección de servidor
        socketTimeoutMS: 45000, // 45 segundos de timeout
      };

      this.connection = await mongoose.connect(uri, options);
      console.log(`✅ Conexión exitosa a MongoDB ${useAtlas ? 'Atlas' : 'Local'}`);
      this.reconnectAttempts = 0; // Resetear intentos después de conexión exitosa

      // Manejo de eventos
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ Conexión a MongoDB perdida. Intentando reconectar...');
        this.reconnect(useAtlas);
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ Error en la conexión a MongoDB:', err.message);
      });

      return this.connection;
    } catch (error) {
      console.error(`❌ Error al conectar a MongoDB (${useAtlas ? 'Atlas' : 'Local'}):`, error.message);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect(useAtlas);
      } else {
        throw new Error('Número máximo de intentos de reconexión alcanzado');
      }
    }
  }

  async reconnect(useAtlas) {
    this.reconnectAttempts++;
    const delay = Math.min(5000 * this.reconnectAttempts, 30000); // Backoff exponencial hasta 30 seg
    
    console.log(`🔄 Intento ${this.reconnectAttempts} de ${this.maxReconnectAttempts}. Reintentando en ${delay/1000} segundos...`);
    
    setTimeout(() => {
      this.connect(useAtlas);
    }, delay);
  }

  async disconnect() {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      try {
      await mongoose.disconnect();
      this.connection = null;
      console.log('🛑 Conexión a MongoDB cerrada correctamente.');
      } catch (error) {
      console.error('❌ Error al cerrar la conexión a MongoDB:', error.message);
      }
    } else {
      console.log('ℹ️ No hay conexión activa de MongoDB para cerrar.');
    }
  }

  getConnectionStatus() {
    return {
      status: mongoose.connection.readyState,
      state: this.getConnectionStateName(mongoose.connection.readyState)
    };
  }

  getConnectionStateName(state) {
    const states = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
      99: 'Uninitialized'
    };
    return states[state] || 'Unknown';
  }
}

const mongoInstance = new MongoConnection();

export default mongoInstance;