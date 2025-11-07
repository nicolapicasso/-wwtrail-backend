// src/services/admin.service.ts

import { UserRole, Prisma } from '@prisma/client';
import prisma from '../config/database';

// ============================================
// INTERFACES
// ============================================

interface GetUsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'firstName' | 'email' | 'role';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedUsers {
  users: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalCompetitions: number;
  totalEditions: number;
  pendingApprovals: number;
  newUsersThisMonth: number;
  newEventsThisMonth: number;
  activeUsers: number;
  usersByRole: {
    role: string;
    count: number;
  }[];
  recentActivity: {
    type: string;
    count: number;
    date: string;
  }[];
}

interface UserStats {
  totalCompetitions: number;
  totalReviews: number;
  lastActivity: Date | null;
}

// ============================================
// ADMIN SERVICE
// ============================================

class AdminService {
  /**
   * Obtener estadísticas generales del dashboard
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Ejecutar todas las queries en paralelo
    const [
      totalUsers,
      totalEvents,
      totalCompetitions,
      totalEditions,
      pendingEvents,
      newUsersThisMonth,
      newEventsThisMonth,
      activeUsers,
      usersByRole,
    ] = await Promise.all([
      // Total de usuarios
      prisma.user.count(),

      // Total de eventos
      prisma.event.count(),

      // Total de competiciones
      prisma.competition.count(),

      // Total de ediciones
      prisma.edition.count(),

      // Eventos pendientes de aprobación (DRAFT)
      prisma.event.count({
        where: { status: 'DRAFT' },
      }),

      // Nuevos usuarios este mes
      prisma.user.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // Nuevos eventos este mes
      prisma.event.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth,
          },
        },
      }),

      // Usuarios activos
      prisma.user.count({
        where: { isActive: true },
      }),

      // Usuarios por rol
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true,
        },
      }),
    ]);

    // Actividad reciente (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const recentEvents = await prisma.event.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const recentReviews = await prisma.review.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      totalUsers,
      totalEvents,
      totalCompetitions,
      totalEditions,
      pendingApprovals: pendingEvents,
      newUsersThisMonth,
      newEventsThisMonth,
      activeUsers,
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.id,
      })),
      recentActivity: [
        {
          type: 'users',
          count: recentUsers,
          date: sevenDaysAgo.toISOString(),
        },
        {
          type: 'events',
          count: recentEvents,
          date: sevenDaysAgo.toISOString(),
        },
        {
          type: 'reviews',
          count: recentReviews,
          date: sevenDaysAgo.toISOString(),
        },
      ],
    };
  }

  /**
   * Listar usuarios con filtros y paginación
   */
  async getUsers(filters: GetUsersFilters): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Construir where clause
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Calcular offset
    const skip = (page - 1) * limit;

    // Ejecutar queries en paralelo
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              userCompetitions: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calcular paginación
    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats: {
          competitions: user._count.userCompetitions,
          reviews: user._count.reviews,
        },
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Obtener un usuario por ID con información detallada
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        phone: true,
        city: true,
        country: true,
        language: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            userCompetitions: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      bio: user.bio,
      avatar: user.avatar,
      phone: user.phone,
      city: user.city,
      country: user.country,
      language: user.language,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        competitions: user._count.userCompetitions,
        reviews: user._count.reviews,
      },
    };
  }

  /**
   * Cambiar el rol de un usuario
   */
  async updateUserRole(userId: string, newRole: UserRole, adminId: string) {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // No permitir que un admin se quite su propio rol de admin
    if (userId === adminId && user.role === 'ADMIN' && newRole !== 'ADMIN') {
      throw new Error('Cannot remove your own admin role');
    }

    // Actualizar rol
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      ...updatedUser,
      fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.username,
    };
  }

  /**
   * Activar/Desactivar un usuario
   */
  async toggleUserStatus(userId: string, adminId: string) {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // No permitir desactivar el propio usuario admin
    if (userId === adminId) {
      throw new Error('Cannot deactivate your own account');
    }

    // Toggle isActive
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      ...updatedUser,
      fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.username,
    };
  }

  /**
   * Eliminar un usuario (soft delete si tiene contenido)
   */
  async deleteUser(userId: string, adminId: string) {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        _count: {
          select: {
            userCompetitions: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // No permitir eliminar el propio usuario admin
    if (userId === adminId) {
      throw new Error('Cannot delete your own account');
    }

    // Verificar si el usuario tiene contenido asociado
    const hasContent =
      user._count.userCompetitions > 0 ||
      user._count.reviews > 0;

    if (hasContent) {
      // Soft delete: desactivar usuario
      const deactivatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      });

      return {
        deleted: false,
        deactivated: true,
        user: deactivatedUser,
        message:
          'User has associated content. Account has been deactivated instead of deleted.',
      };
    } else {
      // Hard delete: eliminar usuario completamente
      await prisma.user.delete({
        where: { id: userId },
      });

      return {
        deleted: true,
        deactivated: false,
        message: 'User deleted successfully',
      };
    }
  }

  /**
   * Obtener estadísticas de un usuario específico
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        _count: {
          select: {
            userCompetitions: true,
            reviews: true,
          },
        },
        userCompetitions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Determinar última actividad
    const activities = [
      ...(user.userCompetitions.length > 0
        ? [user.userCompetitions[0].createdAt]
        : []),
      ...(user.reviews.length > 0 ? [user.reviews[0].createdAt] : []),
    ];

    const lastActivity =
      activities.length > 0
        ? activities.reduce((latest, current) =>
            current > latest ? current : latest
          )
        : null;

    const stats: UserStats = {
      totalCompetitions: user._count.userCompetitions,
      totalReviews: user._count.reviews,
      lastActivity,
    };

    return stats;
  }
}

export default new AdminService();
