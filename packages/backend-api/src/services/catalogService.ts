import { prisma } from '../prisma';

export class CatalogService {
  /**
   * Get all active categories with service count
   */
  static async getCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });
  }

  /**
   * Get category by slug or id including services
   */
  static async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        services: {
          where: { isActive: true },
        },
      },
    });
  }

  /**
   * Search / filter services across categories
   */
  static async getServices(categoryId?: string, query?: string) {
    const where: any = { isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
      ];
    }

    return prisma.service.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get service details with providers who offer it
   */
  static async getServiceDetails(serviceId: string) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        category: true,
        providerRates: {
          where: {
            isActive: true,
            provider: {
              verificationStatus: 'APPROVED',
              isAcceptingBookings: true,
            },
          },
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return service;
  }
}

