// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true //elimina espacios innecesarios
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Por favor ingresa un correo válido'] // Validación de formato de email
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Longitud mínima de la contraseña
   
  },
   role: {
    type: String,
    enum: ["admin", "cliente", "vendedor"],
    default: "cliente"
  }
  
}, 
{
  timestamps: true
});

export default mongoose.model('User', userSchema);
  