import { SupabaseDb, mapCategoryDto, mapServiceDto } from './db/supabaseDb';

export const SUPABASE_CONFIG = {
  get url() {
    return SupabaseDb.url;
  },
  get anonKey() {
    return process.env.SUPABASE_ANON_KEY || '';
  },
  get serviceKey() {
    return SupabaseDb.serviceRoleKey;
  },
};

function slugify(input: string): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `item-${Date.now()}`;
}

export class SupabaseStorageService {
  static async createCategory(payload: {
    name: string;
    description?: string;
    display_order?: number;
    icon?: string;
    icon_url?: string;
    image_url?: string;
  }) {
    const slug = `${slugify(payload.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const row = await SupabaseDb.insertOne<any>('categories', {
      name: payload.name.trim(),
      slug,
      description: payload.description || '',
      icon_url: payload.icon_url || payload.icon || null,
      image_url: payload.image_url || null,
      display_order: Number(payload.display_order ?? 0),
      is_active: true,
    });
    SupabaseDb.broadcastSync('catalog_updated', { entity: 'category', id: row.id });
    return mapCategoryDto(row);
  }

  static async updateCategory(id: string, updates: any) {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.display_order !== undefined || updates.displayOrder !== undefined) {
      patch.display_order = Number(updates.display_order ?? updates.displayOrder);
    }
    if (updates.icon_url !== undefined || updates.icon !== undefined || updates.iconUrl !== undefined) {
      patch.icon_url = updates.icon_url ?? updates.icon ?? updates.iconUrl;
    }
    if (updates.image_url !== undefined || updates.imageUrl !== undefined) {
      patch.image_url = updates.image_url ?? updates.imageUrl;
    }
    if (updates.is_active !== undefined || updates.isActive !== undefined) {
      patch.is_active = Boolean(updates.is_active ?? updates.isActive);
    }
    const row = await SupabaseDb.updateOne<any>('categories', id, patch);
    if (row) SupabaseDb.broadcastSync('catalog_updated', { entity: 'category', id });
    return row ? mapCategoryDto(row) : null;
  }

  static async deleteCategory(id: string) {
    const removed = await SupabaseDb.remove('categories', `id=eq.${encodeURIComponent(id)}`);
    if (removed.length > 0) SupabaseDb.broadcastSync('catalog_updated', { entity: 'category', id });
    return removed.length > 0;
  }

  static async createService(payload: {
    name: string;
    category_id: string;
    description?: string;
    base_price?: number;
    duration_minutes?: number;
    image_url?: string;
  }) {
    const slug = `${slugify(payload.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const row = await SupabaseDb.insertOne<any>('services', {
      category_id: payload.category_id,
      name: payload.name.trim(),
      slug,
      description: payload.description || '',
      base_price: Number(payload.base_price ?? 0),
      duration_minutes: Number(payload.duration_minutes ?? 60),
      image_url: payload.image_url || null,
      is_active: true,
    });
    SupabaseDb.broadcastSync('catalog_updated', { entity: 'service', id: row.id });
    return mapServiceDto(row);
  }

  static async updateService(id: string, updates: any) {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.category_id !== undefined || updates.categoryId !== undefined) {
      patch.category_id = updates.category_id ?? updates.categoryId;
    }
    if (updates.base_price !== undefined || updates.basePrice !== undefined) {
      patch.base_price = Number(updates.base_price ?? updates.basePrice);
    }
    if (updates.duration_minutes !== undefined || updates.durationMinutes !== undefined) {
      patch.duration_minutes = Number(updates.duration_minutes ?? updates.durationMinutes);
    }
    if (updates.image_url !== undefined || updates.imageUrl !== undefined) {
      patch.image_url = updates.image_url ?? updates.imageUrl;
    }
    if (updates.is_active !== undefined || updates.isActive !== undefined) {
      patch.is_active = Boolean(updates.is_active ?? updates.isActive);
    }
    const row = await SupabaseDb.updateOne<any>('services', id, patch);
    if (row) SupabaseDb.broadcastSync('catalog_updated', { entity: 'service', id });
    return row ? mapServiceDto(row) : null;
  }

  static async deleteService(id: string) {
    const removed = await SupabaseDb.remove('services', `id=eq.${encodeURIComponent(id)}`);
    if (removed.length > 0) SupabaseDb.broadcastSync('catalog_updated', { entity: 'service', id });
    return removed.length > 0;
  }

  static async getCities(activeOnly = false) {
    const filter = activeOnly ? 'select=*&is_active=eq.true&order=name.asc' : 'select=*&order=name.asc';
    return SupabaseDb.select<any>('cities', filter);
  }

  static async addCity(payload: { name: string; state: string; is_active?: boolean; latitude?: number; longitude?: number }) {
    const row = await SupabaseDb.insertOne<any>('cities', {
      name: payload.name.trim(),
      state: payload.state.trim(),
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      is_active: payload.is_active !== false,
    });
    SupabaseDb.broadcastSync('cities_updated', { entity: 'city', id: row.id });
    return row;
  }

  static async updateCity(id: string, updates: any) {
    const patch: Record<string, any> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.state !== undefined) patch.state = updates.state;
    if (updates.is_active !== undefined || updates.isActive !== undefined) {
      patch.is_active = Boolean(updates.is_active ?? updates.isActive);
    }
    const row = await SupabaseDb.updateOne<any>('cities', id, patch);
    if (row) SupabaseDb.broadcastSync('cities_updated', { entity: 'city', id });
    return row;
  }

  static async deleteCity(id: string) {
    const removed = await SupabaseDb.remove('cities', `id=eq.${encodeURIComponent(id)}`);
    if (removed.length > 0) SupabaseDb.broadcastSync('cities_updated', { entity: 'city', id });
    return removed.length > 0;
  }
}
