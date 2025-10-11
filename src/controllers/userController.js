import User from '../models/Model.User.js';
import bcrypt from 'bcryptjs';
import { MyToken } from '../lib/jwt.js';

// Crear un nuevo usuario
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json({ message: "The email is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "cliente" // 👈 unificado a role
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: { // 👈 Devolver solo los campos necesarios
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

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


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Comparar contraseña
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Crear token con email y rol
    const token = await MyToken({  
      email: user.email, 
      role: user.role  // 👈 aquí metemos el rol
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role  // 👈 también lo mandamos en la respuesta
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// cerrar sesión (logout) - opcional, ya que con JWT es más común manejarlo en el cliente
export const logoutUser = (req, res) => {
  // En JWT, el logout se maneja en el cliente eliminando el token. 
  res.json({ message: "Logout successful on client side by deleting the token" });    
};