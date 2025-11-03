import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!; // Fallback al mismo secret
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Validar que exista JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  static async register(data: RegisterInput) {
    // Verificar si el email ya existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError('Email already registered', 400);
    }

    // Verificar si el username ya existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new AppError('Username already taken', 400);
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        language: data.language || 'ES',
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        language: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${user.email} (${user.username})`);

    // Generar tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  static async login(data: LoginInput) {
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verificar si está activo
    if (!user.isActive) {
      throw new AppError('Account is inactive', 403);
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }, // Se actualiza automáticamente el updatedAt
    });

    // Generar tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Retornar usuario sin contraseña
    const { password, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${user.email}`);

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(token: string) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;

      // Verificar que existe en la BD
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!storedToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Verificar expiración
      if (new Date() > storedToken.expiresAt) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new AppError('Refresh token expired', 401);
      }

      // Verificar que el usuario está activo
      if (!storedToken.user.isActive) {
        throw new AppError('Account is inactive', 403);
      }

      // Generar nuevos tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
        storedToken.user
      );

      // Eliminar el refresh token antiguo
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  static async logout(token: string) {
    // Eliminar refresh token de la BD
    const deleted = await prisma.refreshToken.deleteMany({
      where: { token },
    });

    logger.info(`Refresh token deleted: ${deleted.count} token(s)`);

    return { message: 'Logged out successfully' };
  }

  // Método adicional: logout por userId (elimina TODOS los refresh tokens del usuario)
  static async logoutAll(userId: string) {
    const deleted = await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info(`All refresh tokens deleted for user ${userId}: ${deleted.count} token(s)`);

    return { 
      message: 'Logged out from all devices successfully',
      tokensDeleted: deleted.count 
    };
  }

  // Método para obtener información del usuario actual (usado en /me)
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        language: true,
        avatar: true,
        bio: true,
        phone: true,
        country: true,
        city: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('Account is inactive', 403);
    }

    return user;
  }

  private static async generateTokens(user: { id: string; email: string; role: UserRole }) {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Access token
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Refresh token
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    // Guardar refresh token en BD
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  static async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid token', 401);
    }
  }
}
