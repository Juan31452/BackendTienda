import { Request, Response } from 'express';
import User from '../models/Model.User.ts';
import bcrypt from 'bcryptjs';
// @ts-ignore - Asegúrate de que jwt.ts exista o se maneje vía NodeNext
import { MyToken } from '../lib/jwt.ts';
import { successResponse, errorResponse } from '../utilities/respuestas.ts';

/**
 * Crea un nuevo usuario en la base de datos.
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, "Name, email, and password are required", 400);
    }

    const userFound = await User.findOne({ email });
    if (userFound) {
      return errorResponse(res, "The email is already in use", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "cliente"
    });

    await newUser.save();

    successResponse(res, {
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    }, 201);

  } catch (error: any) {
    errorResponse(res, "Error creating user", 500, error.message);
  }
};

/**
 * Lista todos los usuarios (excluyendo contraseñas).
 */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    successResponse(res, users);
  } catch (error: any) {
    errorResponse(res, "Error fetching users", 500, error.message);
  }
};

/**
 * Autentica un usuario y genera un token JWT.
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Email and password are required", 400);
    }

    // Es necesario usar .select('+password') porque en el modelo está marcado como oculto por defecto
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, "Invalid email or password", 400);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return errorResponse(res, "Invalid email or password", 400);
    }

    const token = await MyToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    successResponse(res, {
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    errorResponse(res, "Error logging in", 500, error.message);
  }
};

/**
 * Simula el cierre de sesión informando al cliente.
 */
export const logoutUser = (_req: Request, res: Response): void => {
  successResponse(res, { message: "Logout successful on client side by deleting the token" });
};