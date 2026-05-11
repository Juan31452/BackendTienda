import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Producto from '../models/Model.Products.ts';
import { successResponse, errorResponse } from '../utilities/respuestas.ts';
import * as ProductService from '../services/productService.ts';
import { IUser } from '../models/Model.User.ts';
import { AuthenticatedRequest } from '../types/index.ts';

export const obtenerProductos = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await ProductService.getProductsFiltered(req.query, req.user);
    res.status(200).json({ success: true, ...data });
  } catch (error: any) {
    errorResponse(res, 'Error al obtener los productos', 500, error.message);
  }
};

export const asignarVendedorGlobal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    return errorResponse(res, 'Acción no autorizada. Se requiere rol de administrador.', 403);
  }

  try {
    const vendedor = await mongoose.model<IUser>('User').findOne({ role: 'vendedor' });

    if (!vendedor) {
      return errorResponse(res, 'No se encontró ningún usuario con el rol "vendedor".', 404);
    }

    const resultado = await Producto.updateMany(
      { vendedor: { $exists: false } },
      { $set: { vendedor: vendedor._id } }
    );

    successResponse(res, {
      message: `Operación completada. Se asignó el vendedor "${vendedor.name}" a ${resultado.modifiedCount} productos.`,
      vendedorAsignado: {
        id: vendedor._id,
        name: vendedor.name
      }
    });
  } catch (error: any) {
    errorResponse(res, 'Error durante la asignación masiva.', 500, error.message);
  }
};

export const obtenerProductoPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const producto = await Producto.findOne({ IdProducto: req.params.id }).lean();
    if (!producto) {
      return errorResponse(res, 'Producto no encontrado', 404);
    }
    successResponse(res, producto);
  } catch (error: any) {
    errorResponse(res, 'Error al obtener el producto', 500, error.message);
  }
};

export const crearProducto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { IdProducto, Descripcion, Precio, vendedor: vendedorIdFromBody } = req.body;
    const user = req.user;
    
    if (!IdProducto || !Descripcion || !Precio || !user) {
      return errorResponse(res, 'IdProducto, Descripcion y Precio son requeridos', 400);
    }

    let finalVendedorId: string;

    if (user.role === 'admin') {
      if (!vendedorIdFromBody) {
        return errorResponse(res, 'Como admin, debe especificar el ID del vendedor.', 400);
      }
      finalVendedorId = vendedorIdFromBody;
    } else if (user.role === 'vendedor') {
      finalVendedorId = user.id;
    } else {
      return errorResponse(res, 'No tiene permisos para crear productos.', 403);
    }

    const existeProducto = await Producto.findOne({ IdProducto });
    if (existeProducto) {
      return errorResponse(res, 'Ya existe un producto con este IdProducto', 400);
    }

    const nuevoProducto = new Producto({
      ...req.body,
      vendedor: finalVendedorId
    });

    const productoGuardado = await nuevoProducto.save();
    successResponse(res, productoGuardado, 201);
  } catch (error: any) {
    errorResponse(res, 'Error al crear el producto', 400, error.message);
  }
};

export const crearProductos = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await ProductService.createMultipleProductsService(req.body, req.user as any);
    successResponse(res, result, 201);
  } catch (error: any) {
    const status = error.message.includes('permisos') ? 403 : 400;
    errorResponse(res, error.message, status);
  }
};

export const actualizarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    if (Object.keys(req.body).length === 0) {
      return errorResponse(res, 'No hay datos para actualizar', 400);
    }

    const productoActualizado = await Producto.findOneAndUpdate(
      { IdProducto: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!productoActualizado) {
      return errorResponse(res, 'Producto no encontrado', 404);
    }
    
    successResponse(res, productoActualizado);
  } catch (error: any) {
    errorResponse(res, 'Error al actualizar el producto', 400, error.message);
  }
};

export const eliminarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const productoEliminado = await Producto.findOneAndDelete({ IdProducto: req.params.id });
    if (!productoEliminado) {
      return errorResponse(res, 'Producto no encontrado', 404);
    }
    successResponse(res, { message: 'Producto eliminado con éxito', id: req.params.id });
  } catch (error: any) {
    errorResponse(res, 'Error al eliminar el producto', 500, error.message);
  }
};

export const obtenerEstadisticasProductos = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const estadisticas = await ProductService.getProductStatsService(
      req.query.search as string,
      req.user as any,
      req.query.vendedor as string
    );

    // Calculamos el total de productos sumando los estados de todas las categorías
    const totalProductos = estadisticas.reduce((acc, cat) => {
      const sumaCategoria = Object.values(cat.estados).reduce((a, b) => a + b, 0);
      return acc + sumaCategoria;
    }, 0);

    res.status(200).json({ success: true, estadisticas, totalProductos });
  } catch (error: any) {
    errorResponse(res, 'Error al obtener las estadísticas', 500, error.message);
  }
};

export const getTotalMes = async (req: Request<any>, res: Response): Promise<void> => {
  try {
    // Accedemos a los parámetros de forma segura
    const params = req.params as Record<string, string | undefined>;
    const anioVal = params.anio || params.año;
    const mesVal = params.mes;
    const estadoVal = params.estado;

    if (!anioVal || !mesVal) {
      return errorResponse(res, 'Año y mes son requeridos', 400);
    }

    const { total, startDate, endDate } = await ProductService.getMonthlyTotalService(anioVal, mesVal, estadoVal);

    res.json({
      success: true,
      data: total,
      mes: mesVal,
      anio: anioVal, 
      estado: estadoVal || 'Todos',
      rangoFechas: {
        inicio: startDate.toISOString(),
        fin: endDate.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error en getTotalMes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular total del mes',
      error: error.message
    });
  }
};
