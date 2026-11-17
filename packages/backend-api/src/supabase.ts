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

const DEFAULT_CITY_PINCODES: Record<string, string> = {
  'Warangal': '506001, 506002, 506003, 506004, 506009',
  'Hyderabad': '500001, 500002, 500003, 500016, 500032, 500034, 500081, 500084, 500090',
  'Bengaluru': '560001, 560002, 560004, 560034, 560038, 560066, 560100',
  'Delhi': '110001, 110002, 110003, 110005, 110016, 110020, 110075',
};

async function getPincodesMap(): Promise<Record<string, string>> {
  try {
    const setting = await SupabaseDb.selectOne<any>(
      'system_settings',
      'select=*&key=eq.city_serviceable_pincodes'
    );
    if (setting?.value) {
      const parsed = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_CITY_PINCODES, ...parsed };
      }
    }
  } catch { }
  return { ...DEFAULT_CITY_PINCODES };
}

async function savePincodesMap(map: Record<string, string>) {
  try {
    await SupabaseDb.upsert(
      'system_settings',
      {
        key: 'city_serviceable_pincodes',
        value: JSON.stringify(map),
        updated_at: new Date().toISOString(),
      },
      'key'
    );
  } catch (err) {
    console.warn('Failed to persist city_serviceable_pincodes:', err);
  }
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let finalCatId = payload.category_id;
    if (!isUuid.test(finalCatId)) {
      const cats = await SupabaseDb.select<any>('categories', 'select=*');
      const needle = finalCatId.toLowerCase();
      const matched = cats.find(
        (c) =>
          c.id === finalCatId ||
          c.slug?.toLowerCase() === needle ||
          c.name?.toLowerCase() === needle ||
          c.name?.toLowerCase().includes(needle) ||
          (c.slug && needle.includes(c.slug.toLowerCase()))
      );
      if (matched) {
        finalCatId = matched.id;
      } else if (cats.length > 0) {
        finalCatId = cats[0].id;
      } else {
        const newCat = await this.createCategory({ name: payload.category_id });
        finalCatId = newCat?.id || '9cd63c6f-df58-4dae-b12f-ffa20b7d4cdc';
      }
    }

    const slug = `${slugify(payload.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const row = await SupabaseDb.insertOne<any>('services', {
      category_id: finalCatId,
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
    const [cities, pincodesMap] = await Promise.all([
      SupabaseDb.select<any>('cities', filter),
      getPincodesMap(),
    ]);

    return cities.map((c) => {
      const cityPinStr = c.pincodes || pincodesMap[c.name] || pincodesMap[c.id] || '';
      const list = String(cityPinStr)
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      return {
        ...c,
        pincodes: cityPinStr,
        pincodeList: list,
      };
    });
  }

  static async addCity(payload: {
    name: string;
    state: string;
    pincodes?: string;
    is_active?: boolean;
    latitude?: number;
    longitude?: number;
  }) {
    const insertData: Record<string, any> = {
      name: payload.name.trim(),
      state: payload.state.trim(),
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      is_active: payload.is_active !== false,
    };

    let row: any;
    try {
      row = await SupabaseDb.insertOne<any>('cities', {
        ...insertData,
        pincodes: payload.pincodes?.trim() || null,
      });
    } catch {
      row = await SupabaseDb.insertOne<any>('cities', insertData);
    }

    if (payload.pincodes && payload.pincodes.trim()) {
      const currentMap = await getPincodesMap();
      currentMap[payload.name.trim()] = payload.pincodes.trim();
      currentMap[row.id] = payload.pincodes.trim();
      await savePincodesMap(currentMap);
    }

    SupabaseDb.broadcastSync('cities_updated', { entity: 'city', id: row.id });
    return {
      ...row,
      pincodes: payload.pincodes?.trim() || '',
      pincodeList: (payload.pincodes || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    };
  }

  static async updateCity(id: string, updates: any) {
    const patch: Record<string, any> = {};
    if (updates.name !== undefined) patch.name = updates.name.trim();
    if (updates.state !== undefined) patch.state = updates.state.trim();
    if (updates.is_active !== undefined || updates.isActive !== undefined) {
      patch.is_active = Boolean(updates.is_active ?? updates.isActive);
    }
    if (updates.pincodes !== undefined) {
      patch.pincodes = String(updates.pincodes).trim();
    }

    let row: any;
    try {
      row = await SupabaseDb.updateOne<any>('cities', id, patch);
    } catch {
      delete patch.pincodes;
      row = await SupabaseDb.updateOne<any>('cities', id, patch);
    }

    if (updates.pincodes !== undefined) {
      const currentMap = await getPincodesMap();
      const cityName = row?.name || updates.name;
      if (cityName) currentMap[cityName] = String(updates.pincodes).trim();
      currentMap[id] = String(updates.pincodes).trim();
      await savePincodesMap(currentMap);
    }

    if (row) SupabaseDb.broadcastSync('cities_updated', { entity: 'city', id });
    const currentMap = await getPincodesMap();
    const pinStr = updates.pincodes ?? currentMap[row?.name] ?? currentMap[id] ?? '';
    return {
      ...row,
      pincodes: pinStr,
      pincodeList: String(pinStr)
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean),
    };
  }

  static async deleteCity(id: string) {
    const city = await SupabaseDb.selectOne<any>('cities', `select=name&id=eq.${encodeURIComponent(id)}`);
    const removed = await SupabaseDb.remove('cities', `id=eq.${encodeURIComponent(id)}`);
    if (city?.name) {
      const currentMap = await getPincodesMap();
      delete currentMap[city.name];
      delete currentMap[id];
      await savePincodesMap(currentMap);
    }
    if (removed.length > 0) SupabaseDb.broadcastSync('cities_updated', { entity: 'city', id });
    return removed.length > 0;
  }
}
