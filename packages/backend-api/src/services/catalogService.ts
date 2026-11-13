import { SupabaseDb, mapCategoryDto, mapServiceDto, mapProviderDto } from '../db/supabaseDb';

export class CatalogService {
  static async getCategories(includeInactive = false) {
    const catFilter = includeInactive
      ? 'select=*&order=display_order.asc,name.asc'
      : 'select=*&is_active=eq.true&order=display_order.asc,name.asc';

    const [categories, services] = await Promise.all([
      SupabaseDb.select<any>('categories', catFilter),
      SupabaseDb.select<any>('services', 'select=id,category_id,is_active&is_active=eq.true'),
    ]);

    const countByCat = new Map<string, number>();
    for (const s of services) {
      countByCat.set(s.category_id, (countByCat.get(s.category_id) || 0) + 1);
    }

    return categories.map((c) => mapCategoryDto(c, countByCat.get(c.id) || 0));
  }

  static async getServices(categoryId?: string, search?: string, includeInactive = false) {
    const filters = ['select=*'];
    if (!includeInactive) filters.push('is_active=eq.true');
    if (categoryId) filters.push(`category_id=eq.${encodeURIComponent(categoryId)}`);
    filters.push('order=name.asc');

    const [services, categories] = await Promise.all([
      SupabaseDb.select<any>('services', filters.join('&')),
      SupabaseDb.select<any>('categories', 'select=*'),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    let mapped = services
      .map((s) => mapServiceDto(s, catMap.get(s.category_id)))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      mapped = mapped.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category?.name?.toLowerCase().includes(q)
      );
    }

    return mapped;
  }

  static async getServiceDetails(serviceId: string) {
    const serviceRow = await SupabaseDb.selectOne<any>(
      'services',
      `select=*&id=eq.${encodeURIComponent(serviceId)}`
    );
    if (!serviceRow) return null;

    const categoryRow = await SupabaseDb.selectOne<any>(
      'categories',
      `select=*&id=eq.${encodeURIComponent(serviceRow.category_id)}`
    );

    const providerRates = await SupabaseDb.select<any>(
      'provider_service_rates',
      `select=*&service_id=eq.${encodeURIComponent(serviceId)}&is_active=eq.true`
    );

    let providers: any[] = [];
    if (providerRates.length > 0) {
      const providerIds = Array.from(new Set(providerRates.map((r) => r.provider_id)));
      const provRows = await SupabaseDb.select<any>(
        'provider_profiles',
        `select=*&id=in.(${providerIds.join(',')})&verification_status=eq.APPROVED&is_accepting_bookings=eq.true`
      );
      if (provRows.length > 0) {
        const userIds = Array.from(new Set(provRows.map((p) => p.user_id)));
        const userRows = await SupabaseDb.select<any>(
          'users',
          `select=id,full_name,avatar_url&id=in.(${userIds.join(',')})`
        );
        const userMap = new Map(userRows.map((u) => [u.id, u]));
        providers = provRows.map((p) => mapProviderDto(p, { user: userMap.get(p.user_id) }));
      }
    }

    return {
      ...mapServiceDto(serviceRow, categoryRow),
      providers,
    };
  }
}
