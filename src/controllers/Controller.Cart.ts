import { Response } from 'express';
import Cart, { ICart, ICartItem } from '../models/Model.Cart.ts';
import Producto from '../models/Model.Products.ts';
import { successResponse, errorResponse } from '../utilities/respuestas.ts';
import { AuthenticatedRequest } from '../types/index.ts';

// Obtener el carrito del usuario autenticado
export const getCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 'Usuario no autenticado', 401);
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId', 'IdProducto Descripcion Imagen Precio');

    if (!cart) {
      // Si no hay carrito, devolver un carrito vacío
      return successResponse(res, { items: [], totalPrice: 0 });
    }

    successResponse(res, cart);
  } catch (error: any) {
    errorResponse(res, 'Error al obtener el carrito', 500, error.message);
  }
};

// Añadir un producto al carrito o actualizar su cantidad
export const addItemToCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { productId, quantity } = req.body;

    if (!userId) {
      return errorResponse(res, 'Usuario no autenticado', 401);
    }
    if (!productId || !quantity || quantity < 1) {
      return errorResponse(res, 'ID de producto y cantidad válida son requeridos', 400);
    }

    const product = await Producto.findById(productId);
    if (!product) {
      return errorResponse(res, 'Producto no encontrado', 404);
    }

    let cart: ICart | null = await Cart.findOne({ userId });

    if (!cart) {
      // Crear un nuevo carrito si no existe
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      // Si el producto ya está en el carrito, actualizar la cantidad
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Si el producto no está en el carrito, añadirlo
      const newItem: ICartItem = {
        productId: product._id,
        name: product.Descripcion,
        image: product.Imagen || '', // Asegúrate de tener un campo de imagen en tu modelo de producto
        price: product.Precio, // Usar el precio actual del producto
        quantity,
      };
      cart.items.push(newItem);
    }

    await cart.save(); // El pre-save hook calculará el totalPrice
    successResponse(res, cart, 200);
  } catch (error: any) {
    errorResponse(res, 'Error al añadir producto al carrito', 500, error.message);
  }
};

// Actualizar la cantidad de un producto en el carrito
export const updateCartItemQuantity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      return errorResponse(res, 'Usuario no autenticado', 401);
    }
    if (!quantity || quantity < 0) {
      return errorResponse(res, 'Cantidad válida es requerida', 400);
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return errorResponse(res, 'Carrito no encontrado', 404);
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      if (quantity === 0) {
        cart.items.splice(itemIndex, 1); // Eliminar si la cantidad es 0
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      await cart.save();
      successResponse(res, cart, 200);
    } else {
      errorResponse(res, 'Producto no encontrado en el carrito', 404);
    }
  } catch (error: any) {
    errorResponse(res, 'Error al actualizar la cantidad del producto', 500, error.message);
  }
};

// Eliminar un producto del carrito
export const removeCartItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return errorResponse(res, 'Usuario no autenticado', 401);
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } },
      { new: true } // Devolver el carrito actualizado
    );

    if (!cart) {
      return errorResponse(res, 'Carrito no encontrado', 404);
    }

    await cart.save(); // Recalcular el total después de eliminar
    successResponse(res, cart, 200);
  } catch (error: any) {
    errorResponse(res, 'Error al eliminar producto del carrito', 500, error.message);
  }
};

// Vaciar el carrito
export const clearCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return errorResponse(res, 'Usuario no autenticado', 401);
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalPrice: 0 },
      { new: true }
    );

    if (!cart) {
      return errorResponse(res, 'Carrito no encontrado', 404);
    }

    successResponse(res, cart, 200);
  } catch (error: any) {
    errorResponse(res, 'Error al vaciar el carrito', 500, error.message);
  }
};
