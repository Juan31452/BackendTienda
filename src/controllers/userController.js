import User from '../models/Model.User.js';
import bcrypt from 'bcryptjs';

// Crear un nuevo usuario
export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validación básica
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Verificar si el email ya está en uso
    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json({ message: "The email is already in use" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// Listar todos los usuarios
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // excluye el campo password
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};
