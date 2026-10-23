import User, { IUser } from '../models/Model.User.ts';
import bcrypt from 'bcryptjs';
import { MyToken } from '../lib/jwt.ts';

export class UserService {
  static async authenticate(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid email or password");
    }

    const token = await MyToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  static async getAllUsers() {
    return await User.find().select('-password');
  }

  // ... otros métodos como registerUser
}
