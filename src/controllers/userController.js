import { User } from '../models/UserModelo.js';

export const userController = (req, res) => {
  const users = User.getAll();
  res.json(users);
};