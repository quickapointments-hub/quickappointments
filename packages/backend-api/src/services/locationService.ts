import fs from 'fs';
import path from 'path';
import { SupabaseDb } from '../db/supabaseDb';

export interface LocationRecord {
  id: string;
  country: string;
  state: string;
  city: string;
  district: string;
  pincode: string;
  is_active: boolean;
  customer_count?: number;
  provider_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ValidatePincodeResult {
  serviceable: boolean;
  message: string;
  location: {
    id?: string;
    country: string;
    state: string;
    city: string;
    district: string;
    pincode: string;
    is_active: boolean;
  } | null;
}

// Local persistent backup storage path for resilience
const LOCAL_STORAGE_FILE = path.resolve(__dirname, '../../data/location_master.json');

function ensureLocalDir() {
  const dir = path.dirname(LOCAL_STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLocalLocations(): LocationRecord[] {
  try {
    ensureLocalDir();
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.warn('[LocationService] Failed to read local storage:', err);
  }
  return [];
}

function writeLocalLocations(locations: LocationRecord[]): void {
  try {
    ensureLocalDir();
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(locations, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LocationService] Failed to write local storage:', err);
  }
}

export class LocationService {
  /**
   * Helper to retrieve all locations from Supabase or fallback to local store
   */
  private static async getAllFromDbOrLocal(): Promise<LocationRecord[]> {
    let rows: LocationRecord[] = [];
    try {
      const dbRows = await SupabaseDb.select<LocationRecord>(
        'location_master',
        'select=*&order=created_at.desc'
      );
      if (Array.isArray(dbRows) && dbRows.length > 0) {
        rows = dbRows;
      }
    } catch {
      // Remote DB offline or table not yet created
    }

    if (rows.length === 0) {
      rows = readLocalLocations();
    }

    // Merge any PIN codes from cities table that might not be in location_master
    try {
      const cities = await SupabaseDb.select<any>('cities', 'select=*');
      if (Array.isArray(cities)) {
        for (const c of cities) {
          const rawPincodes = String(c.pincodes || '');
          const pinList = rawPincodes
            .split(',')
            .map((p: string) => p.trim().replace(/\D/g, ''))
            .filter(Boolean);
          for (const p of pinList) {
            if (p.length === 6 && !rows.some((r) => r.pincode === p)) {
              rows.push({
                id: `loc-city-${c.id}-${p}`,
                country: 'India',
                state: c.state || 'Telangana',
                city: c.name,
                district: c.district || c.name,
                pincode: p,
                is_active: c.is_active !== false,
                created_at: c.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch {}

    writeLocalLocations(rows);
    return rows;
  }

  /**
   * Get all admin locations with search, filtering, and provider/customer counts
   */
  static async getLocations(filters?: {
    search?: string;
    status?: string;
    state?: string;
    city?: string;
  }): Promise<LocationRecord[]> {
    const locations = await this.getAllFromDbOrLocal();

    // Fetch live counts from customer_profiles and provider_profiles
    let providers: any[] = [];
    let customers: any[] = [];
    let customerAddresses: any[] = [];

    try {
      const [provRows, custRows, addrRows] = await Promise.all([
        SupabaseDb.select<any>('provider_profiles', 'select=id,pincode,city,location_id'),
        SupabaseDb.select<any>('customer_profiles', 'select=id,pincode,city,location_id'),
        SupabaseDb.select<any>('customer_addresses', 'select=id,pincode,city'),
      ]);
      providers = provRows || [];
      customers = custRows || [];
      customerAddresses = addrRows || [];
    } catch {
      // ignore count lookup error
    }

    const providerCounts = new Map<string, number>();
    for (const p of providers) {
      const pin = String(p.pincode || '').trim();
      if (pin) {
        providerCounts.set(pin, (providerCounts.get(pin) || 0) + 1);
      }
    }

    const customerCounts = new Map<string, number>();
    for (const c of customers) {
      const pin = String(c.pincode || '').trim();
      if (pin) {
        customerCounts.set(pin, (customerCounts.get(pin) || 0) + 1);
      }
    }
    for (const a of customerAddresses) {
      const pin = String(a.pincode || '').trim();
      if (pin) {
        customerCounts.set(pin, (customerCounts.get(pin) || 0) + 1);
      }
    }

    let result = locations.map((loc) => {
      const pin = String(loc.pincode || '').trim();
      return {
        ...loc,
        provider_count: providerCounts.get(pin) || 0,
        customer_count: customerCounts.get(pin) || 0,
      };
    });

    if (filters?.status && filters.status.toUpperCase() !== 'ALL') {
      const wantActive = filters.status.toUpperCase() === 'ACTIVE';
      result = result.filter((loc) => loc.is_active === wantActive);
    }

    if (filters?.state && filters.state.trim()) {
      const qState = filters.state.toLowerCase().trim();
      result = result.filter((loc) => loc.state.toLowerCase() === qState);
    }

    if (filters?.city && filters.city.trim()) {
      const qCity = filters.city.toLowerCase().trim();
      result = result.filter((loc) => loc.city.toLowerCase() === qCity);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (loc) =>
          loc.pincode.includes(q) ||
          loc.city.toLowerCase().includes(q) ||
          loc.state.toLowerCase().includes(q) ||
          loc.district.toLowerCase().includes(q)
      );
    }

    return result;
  }

  /**
   * Validate a 6-digit PIN code against the Admin Panel's active location records.
   * Single source of truth: users can ONLY register in locations configured and active in Admin Panel.
   */
  static async validatePincode(pincode: string): Promise<ValidatePincodeResult> {
    const cleanPin = String(pincode || '').replace(/\D/g, '').trim();

    if (!cleanPin || cleanPin.length !== 6) {
      return {
        serviceable: false,
        message: 'Please enter a valid 6-digit Indian postal PIN code.',
        location: null,
      };
    }

    // Try Supabase first
    let locRecord: LocationRecord | null = null;
    try {
      locRecord = await SupabaseDb.selectOne<LocationRecord>(
        'location_master',
        `select=*&pincode=eq.${encodeURIComponent(cleanPin)}`
      );
    } catch {
      // Supabase offline/error, proceed to local check
    }

    if (!locRecord) {
      const localList = readLocalLocations();
      locRecord = localList.find((l) => l.pincode === cleanPin) || null;
    }

    // Also check cities table in Supabase & system settings (for pincodes configured via Admin Cities)
    if (!locRecord) {
      try {
        const cities = await SupabaseDb.select<any>('cities', 'select=*');
        if (Array.isArray(cities)) {
          for (const c of cities) {
            const rawPincodes = String(c.pincodes || '');
            const pinList = rawPincodes
              .split(',')
              .map((p: string) => p.trim().replace(/\D/g, ''))
              .filter(Boolean);
            if (pinList.includes(cleanPin) || cleanPin === rawPincodes.trim()) {
              locRecord = {
                id: `loc-city-${c.id}-${cleanPin}`,
                country: 'India',
                state: c.state || 'Telangana',
                city: c.name,
                district: c.district || c.name,
                pincode: cleanPin,
                is_active: c.is_active !== false,
                created_at: c.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              // Persist into local locations cache
              try {
                const currentList = readLocalLocations();
                if (!currentList.some((l) => l.pincode === cleanPin)) {
                  currentList.unshift(locRecord);
                  writeLocalLocations(currentList);
                }
              } catch {}
              break;
            }
          }
        }
      } catch {}
    }

    // Also check system_settings city_serviceable_pincodes mapping
    if (!locRecord) {
      try {
        const setting = await SupabaseDb.selectOne<any>(
          'system_settings',
          'select=*&key=eq.city_serviceable_pincodes'
        );
        if (setting?.value) {
          const map = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          if (map && typeof map === 'object') {
            for (const [cityName, rawPins] of Object.entries(map)) {
              const pinList = String(rawPins)
                .split(',')
                .map((p) => p.trim().replace(/\D/g, ''))
                .filter(Boolean);
              if (pinList.includes(cleanPin)) {
                locRecord = {
                  id: `loc-setting-${cleanPin}`,
                  country: 'India',
                  state: 'Telangana',
                  city: cityName,
                  district: cityName,
                  pincode: cleanPin,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                try {
                  const currentList = readLocalLocations();
                  if (!currentList.some((l) => l.pincode === cleanPin)) {
                    currentList.unshift(locRecord);
                    writeLocalLocations(currentList);
                  }
                } catch {}
                break;
              }
            }
          }
        }
      } catch {}
    }

    // Scenario 1: PIN code not configured by Admin
    if (!locRecord) {
      return {
        serviceable: false,
        message: `Registration unavailable. PIN code ${cleanPin} is not currently configured as a serviceable area by Admin.`,
        location: null,
      };
    }

    // Scenario 2: PIN code exists but is inactive / deactivated by Admin
    if (!locRecord.is_active) {
      return {
        serviceable: false,
        message: `Registration unavailable. Service in ${locRecord.city}, ${locRecord.state} (${cleanPin}) is currently inactive.`,
        location: {
          id: locRecord.id,
          country: locRecord.country || 'India',
          state: locRecord.state,
          city: locRecord.city,
          district: locRecord.district,
          pincode: locRecord.pincode,
          is_active: false,
        },
      };
    }

    // Scenario 3: PIN code exists and is active!
    return {
      serviceable: true,
      message: `Location verified: ${locRecord.city}, ${locRecord.district}, ${locRecord.state}`,
      location: {
        id: locRecord.id,
        country: locRecord.country || 'India',
        state: locRecord.state,
        city: locRecord.city,
        district: locRecord.district,
        pincode: locRecord.pincode,
        is_active: true,
      },
    };
  }

  /**
   * Get location record by PIN code
   */
  static async getLocationByPincode(pincode: string): Promise<LocationRecord | null> {
    const cleanPin = String(pincode || '').replace(/\D/g, '').trim();
    if (!cleanPin || cleanPin.length !== 6) return null;

    try {
      const loc = await SupabaseDb.selectOne<LocationRecord>(
        'location_master',
        `select=*&pincode=eq.${encodeURIComponent(cleanPin)}`
      );
      if (loc) return loc;
    } catch {}

    const localList = readLocalLocations();
    return localList.find((l) => l.pincode === cleanPin) || null;
  }

  /**
   * Add a single location PIN code
   */
  static async createLocation(payload: {
    country?: string;
    state: string;
    city: string;
    district: string;
    pincode: string;
    is_active?: boolean;
  }): Promise<LocationRecord> {
    const cleanPin = String(payload.pincode || '').replace(/\D/g, '').trim();
    if (!cleanPin || cleanPin.length !== 6) {
      throw new Error('A valid 6-digit Indian PIN code is required.');
    }
    if (!payload.state?.trim()) throw new Error('State is required.');
    if (!payload.city?.trim()) throw new Error('City is required.');
    if (!payload.district?.trim()) throw new Error('District is required.');

    // Check duplicate
    const existing = await this.getLocationByPincode(cleanPin);
    if (existing) {
      throw new Error(`PIN code ${cleanPin} is already registered under ${existing.city}, ${existing.state}.`);
    }

    const now = new Date().toISOString();
    const newRecord: LocationRecord = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      country: payload.country?.trim() || 'India',
      state: payload.state.trim(),
      city: payload.city.trim(),
      district: payload.district.trim(),
      pincode: cleanPin,
      is_active: payload.is_active !== false,
      created_at: now,
      updated_at: now,
    };

    let saved = newRecord;
    try {
      const inserted = await SupabaseDb.insertOne<LocationRecord>('location_master', {
        country: newRecord.country,
        state: newRecord.state,
        city: newRecord.city,
        district: newRecord.district,
        pincode: newRecord.pincode,
        is_active: newRecord.is_active,
      });
      if (inserted) saved = inserted;
    } catch (e) {
      console.warn('[LocationService] Supabase insert fallback to local file:', e);
    }

    // Sync to local
    const list = readLocalLocations();
    const filtered = list.filter((l) => l.pincode !== cleanPin);
    filtered.unshift(saved);
    writeLocalLocations(filtered);

    SupabaseDb.broadcastSync('locations_updated', { pincode: cleanPin });
    return saved;
  }

  /**
   * Bulk upload PIN codes (from Excel or CSV parsed data)
   */
  static async bulkUploadLocations(rows: Array<{
    country?: string;
    state?: string;
    city?: string;
    district?: string;
    pincode?: string | number;
    is_active?: boolean | string;
  }>): Promise<{
    success: boolean;
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('No rows provided for bulk upload.');
    }

    const existingList = await this.getAllFromDbOrLocal();
    const existingMap = new Map<string, LocationRecord>();
    for (const item of existingList) {
      existingMap.set(item.pincode, item);
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    const toUpsert: any[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;
      const cleanPin = String(r.pincode || '').replace(/\D/g, '').trim();

      if (!cleanPin || cleanPin.length !== 6) {
        errors.push(`Row ${rowNum}: Invalid PIN code "${r.pincode}". Must be 6 digits.`);
        skipped++;
        continue;
      }

      const state = String(r.state || '').trim();
      const city = String(r.city || '').trim();
      const district = String(r.district || city || '').trim();
      const country = String(r.country || 'India').trim();

      if (!state || !city) {
        errors.push(`Row ${rowNum} (${cleanPin}): State and City cannot be empty.`);
        skipped++;
        continue;
      }

      const isActive =
        typeof r.is_active === 'boolean'
          ? r.is_active
          : String(r.is_active || 'true').toLowerCase() !== 'false' &&
            String(r.is_active || '').toLowerCase() !== 'inactive';

      const existingRecord = existingMap.get(cleanPin);

      if (existingRecord) {
        // Update
        existingRecord.state = state;
        existingRecord.city = city;
        existingRecord.district = district;
        existingRecord.country = country;
        existingRecord.is_active = isActive;
        existingRecord.updated_at = now;
        updated++;
      } else {
        // New
        const newRecord: LocationRecord = {
          id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          country,
          state,
          city,
          district,
          pincode: cleanPin,
          is_active: isActive,
          created_at: now,
          updated_at: now,
        };
        existingMap.set(cleanPin, newRecord);
        inserted++;
      }

      toUpsert.push({
        country,
        state,
        city,
        district,
        pincode: cleanPin,
        is_active: isActive,
        updated_at: now,
      });
    }

    // Try batch upsert in Supabase
    if (toUpsert.length > 0) {
      try {
        await SupabaseDb.upsert('location_master', toUpsert, 'pincode');
      } catch (err) {
        console.warn('[LocationService] Supabase batch upsert failed, relying on local sync:', err);
      }
    }

    // Write all to local file
    const allRecords = Array.from(existingMap.values());
    writeLocalLocations(allRecords);

    SupabaseDb.broadcastSync('locations_updated', { bulk: true, count: toUpsert.length });

    return {
      success: true,
      total: rows.length,
      inserted,
      updated,
      skipped,
      errors,
    };
  }

  /**
   * Update location record
   */
  static async updateLocation(
    id: string,
    payload: {
      country?: string;
      state?: string;
      city?: string;
      district?: string;
      pincode?: string;
      is_active?: boolean;
    }
  ): Promise<LocationRecord> {
    const list = await this.getAllFromDbOrLocal();
    const target = list.find((l) => l.id === id || l.pincode === payload.pincode);
    if (!target) {
      throw new Error('Location record not found.');
    }

    const patch: Partial<LocationRecord> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.country !== undefined) patch.country = payload.country.trim();
    if (payload.state !== undefined) patch.state = payload.state.trim();
    if (payload.city !== undefined) patch.city = payload.city.trim();
    if (payload.district !== undefined) patch.district = payload.district.trim();
    if (payload.is_active !== undefined) patch.is_active = Boolean(payload.is_active);

    try {
      await SupabaseDb.updateOne('location_master', target.id, patch);
    } catch {}

    Object.assign(target, patch);
    writeLocalLocations(list);

    SupabaseDb.broadcastSync('locations_updated', { id: target.id });
    return target;
  }

  /**
   * Toggle location active status
   */
  static async toggleLocationStatus(id: string, is_active: boolean): Promise<LocationRecord> {
    return this.updateLocation(id, { is_active });
  }

  /**
   * Delete a location record
   */
  static async deleteLocation(id: string): Promise<boolean> {
    const list = await this.getAllFromDbOrLocal();
    const target = list.find((l) => l.id === id);
    if (!target) return false;

    try {
      await SupabaseDb.remove('location_master', `id=eq.${encodeURIComponent(id)}`);
    } catch {}

    const remaining = list.filter((l) => l.id !== id);
    writeLocalLocations(remaining);

    SupabaseDb.broadcastSync('locations_updated', { deletedId: id });
    return true;
  }
}
