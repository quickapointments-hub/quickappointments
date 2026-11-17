import {
  VerificationStatus,
  CommissionType,
  AdminDashboardMetrics,
} from '@quick-appointments/shared-types';
import {
  SupabaseDb,
  SupabaseDbError,
  mapAuditLogDto,
  mapBookingDto,
  mapCustomerDto,
  mapDocumentDto,
  mapProviderDto,
  mapWorkingHourDto,
} from '../db/supabaseDb';

export class AdminService {
  static async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalCustomers,
      totalProviders,
      activeProviders,
      pendingVerifications,
      bookings,
      earnings,
    ] = await Promise.all([
      SupabaseDb.count('customer_profiles'),
      SupabaseDb.count('provider_profiles'),
      SupabaseDb.count('provider_profiles', 'verification_status=eq.APPROVED&is_accepting_bookings=eq.true'),
      SupabaseDb.count('provider_profiles', 'verification_status=in.(PENDING,UNDER_REVIEW,NEEDS_INFO)'),
      SupabaseDb.select<any>('bookings', 'select=id,date,status,total_amount,platform_commission'),
      SupabaseDb.select<any>('provider_earnings', 'select=net_earnings'),
    ]);

    const todayBookings = bookings.filter((b) => b.date === todayStr).length;
    const completedBookings = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'SETTLED').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;
    const grossRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const platformCommission = bookings.reduce((sum, b) => sum + Number(b.platform_commission || 0), 0);
    const netProviderPayout = earnings.reduce((sum, e) => sum + Number(e.net_earnings || 0), 0);

    return {
      totalCustomers,
      totalProviders,
      activeProviders,
      pendingVerifications,
      totalBookings: bookings.length,
      todayBookings,
      completedBookings,
      cancelledBookings,
      grossRevenue,
      platformCommission,
      netProviderPayout,
    };
  }

  private static async signDocs(docs: any[]) {
    return Promise.all(
      docs.map(async (d) => ({
        ...d,
        file_url: await SupabaseDb.createSignedUrl(d.file_url, 3600),
      }))
    );
  }

  static async getProviders(status?: string, search?: string) {
    const filters = ['select=*', 'order=created_at.desc'];
    if (status && status.toUpperCase() !== 'ALL') {
      filters.push(`verification_status=eq.${encodeURIComponent(status.toUpperCase())}`);
    }

    const provRows = await SupabaseDb.select<any>('provider_profiles', filters.join('&'));
    if (provRows.length === 0) return [];

    const userIds = Array.from(new Set(provRows.map((p) => p.user_id).filter(Boolean)));
    const provIds = provRows.map((p) => p.id);

    const [users, docs, hours, bookings, rates] = await Promise.all([
      userIds.length > 0
        ? SupabaseDb.select<any>('users', `select=id,full_name,email,phone,avatar_url,is_active,created_at&id=in.(${userIds.join(',')})`)
        : Promise.resolve([]),
      SupabaseDb.select<any>('provider_documents', `select=*&provider_id=in.(${provIds.join(',')})`),
      SupabaseDb.select<any>('provider_working_hours', `select=*&provider_id=in.(${provIds.join(',')})`),
      SupabaseDb.select<any>('bookings', `select=id,provider_id&provider_id=in.(${provIds.join(',')})`),
      SupabaseDb.select<any>('provider_service_rates', `select=*&provider_id=in.(${provIds.join(',')})`),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const bookingCounts = new Map<string, number>();
    for (const b of bookings) {
      bookingCounts.set(b.provider_id, (bookingCounts.get(b.provider_id) || 0) + 1);
    }

    let hydrated = await Promise.all(
      provRows.map(async (p) => {
        const pDocs = await this.signDocs(docs.filter((d) => d.provider_id === p.id));
        const pHours = hours.filter((h) => h.provider_id === p.id);
        const pRates = rates.filter((r) => r.provider_id === p.id);
        return mapProviderDto(p, {
          user: userMap.get(p.user_id),
          documents: pDocs,
          workingHours: pHours,
          customServices: pRates,
          bookingCount: bookingCounts.get(p.id) || 0,
        });
      })
    );

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      hydrated = hydrated.filter(
        (p) =>
          p?.businessName?.toLowerCase().includes(q) ||
          p?.city?.toLowerCase().includes(q) ||
          p?.user?.fullName?.toLowerCase().includes(q) ||
          p?.user?.phone?.toLowerCase().includes(q)
      );
    }

    return hydrated;
  }

  static async getProviderDetails(providerId: string) {
    const pid = encodeURIComponent(providerId);
    const providerRow = await SupabaseDb.selectOne<any>('provider_profiles', `select=*&id=eq.${pid}`);
    if (!providerRow) return null;

    const [userRow, docs, hours, branches, staff, rates, serviceRows, earnings, bookings, logs] = await Promise.all([
      SupabaseDb.selectOne<any>('users', `select=id,full_name,email,phone,avatar_url,is_active,created_at&id=eq.${encodeURIComponent(providerRow.user_id)}`),
      SupabaseDb.select<any>('provider_documents', `select=*&provider_id=eq.${pid}`),
      SupabaseDb.select<any>('provider_working_hours', `select=*&provider_id=eq.${pid}&order=day_of_week.asc`),
      SupabaseDb.select<any>('provider_branches', `select=*&provider_id=eq.${pid}`).catch(() => []),
      SupabaseDb.select<any>('provider_staff', `select=*&provider_id=eq.${pid}`).catch(() => []),
      SupabaseDb.select<any>('provider_service_rates', `select=*&provider_id=eq.${pid}`).catch(() => []),
      SupabaseDb.select<any>('services', `select=*`).catch(() => []),
      SupabaseDb.select<any>('provider_earnings', `select=*&provider_id=eq.${pid}&order=created_at.desc`).catch(() => []),
      SupabaseDb.select<any>('bookings', `select=*&provider_id=eq.${pid}&order=created_at.desc&limit=25`).catch(() => []),
      SupabaseDb.select<any>('audit_logs', `select=*&entity_id=eq.${pid}&order=created_at.desc&limit=20`).catch(() => []),
    ]);

    const signedDocs = await this.signDocs(docs);
    const servMap = new Map(serviceRows.map((s) => [s.id, s]));

    // Hydrate booking customers & services
    const customerIds = Array.from(new Set(bookings.map((b) => b.customer_id).filter(Boolean)));
    const custRows =
      customerIds.length > 0
        ? await SupabaseDb.select<any>('customer_profiles', `select=*&id=in.(${customerIds.join(',')})`)
        : [];
    const custUserIds = Array.from(new Set(custRows.map((c) => c.user_id).filter(Boolean)));
    const custUsers =
      custUserIds.length > 0
        ? await SupabaseDb.select<any>('users', `select=id,full_name,phone&id=in.(${custUserIds.join(',')})`)
        : [];
    const custUserMap = new Map(custUsers.map((u) => [u.id, u]));
    const custMap = new Map(custRows.map((c) => [c.id, mapCustomerDto(c, custUserMap.get(c.user_id))]));

    const hydratedProvider = mapProviderDto(providerRow, {
      user: userRow,
      documents: signedDocs,
      workingHours: hours,
      customServices: rates.map((r) => ({
        ...r,
        service: servMap.get(r.service_id) || null,
      })),
    });

    const totalEarnings = earnings.reduce((acc, e) => acc + Number(e.net_earnings || 0), 0);
    const pendingSettlement = earnings
      .filter((e) => !e.is_settled)
      .reduce((acc, e) => acc + Number(e.net_earnings || 0), 0);

    return {
      ...hydratedProvider,
      branches,
      staff,
      earningsSummary: {
        totalNetEarnings: totalEarnings,
        pendingSettlement,
        settledAmount: totalEarnings - pendingSettlement,
      },
      bookings: bookings.map((b) =>
        mapBookingDto(b, {
          service: servMap.get(b.service_id),
          customer: custMap.get(b.customer_id),
        })
      ),
      auditLogs: logs.map((l) => mapAuditLogDto(l)),
    };
  }

  static async toggleProviderAcceptingBookings(providerId: string, isAccepting: boolean, adminUserId: string) {
    const existing = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&id=eq.${encodeURIComponent(providerId)}`
    );
    if (!existing) throw new Error('Provider profile not found');
    if (isAccepting && existing.verification_status !== 'APPROVED') {
      throw new Error('Only APPROVED providers can accept customer bookings');
    }

    const updated = await SupabaseDb.updateOne<any>('provider_profiles', providerId, {
      is_accepting_bookings: Boolean(isAccepting),
      updated_at: new Date().toISOString(),
    });

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: isAccepting ? 'PROVIDER_ONLINE_ENABLED' : 'PROVIDER_BOOKINGS_PAUSED',
      entity_type: 'ProviderProfile',
      entity_id: providerId,
      details: JSON.stringify({ isAcceptingBookings: isAccepting }),
    }).catch(() => {});

    SupabaseDb.broadcastSync('providers_updated', { providerId, userId: existing.user_id });
    const userRow = await SupabaseDb.selectOne<any>('users', `select=*&id=eq.${encodeURIComponent(existing.user_id)}`);
    return mapProviderDto(updated, { user: userRow });
  }

  static async verifyProvider(
    providerId: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CLARITY',
    adminUserId: string,
    reason?: string
  ) {
    const existing = await SupabaseDb.selectOne<any>(
      'provider_profiles',
      `select=*&id=eq.${encodeURIComponent(providerId)}`
    );
    if (!existing) throw new Error('Provider profile not found');

    const newStatus =
      action === 'APPROVE'
        ? VerificationStatus.APPROVED
        : action === 'REQUEST_CLARITY'
          ? VerificationStatus.NEEDS_INFO
          : VerificationStatus.REJECTED;

    const updated = await SupabaseDb.updateOne<any>('provider_profiles', providerId, {
      verification_status: newStatus,
      rejection_reason: action === 'APPROVE' ? null : reason || 'Compliance review requires updates',
      is_accepting_bookings: action === 'APPROVE',
      updated_at: new Date().toISOString(),
    });

    if (action === 'APPROVE' || action === 'REQUEST_CLARITY') {
      await SupabaseDb.update(
        'provider_documents',
        `provider_id=eq.${encodeURIComponent(providerId)}`,
        { is_verified: action === 'APPROVE' }
      ).catch(() => {});
    }

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: action === 'REQUEST_CLARITY' ? 'PROVIDER_NEEDS_INFO' : `PROVIDER_${action}D`,
      entity_type: 'ProviderProfile',
      entity_id: providerId,
      details: JSON.stringify({
        reason: reason || null,
        previousStatus: existing.verification_status,
        newStatus,
      }),
    }).catch(() => {});

    const notifTitle =
      action === 'APPROVE'
        ? 'Account Approved & Activated!'
        : action === 'REQUEST_CLARITY'
        ? 'Document Re-Upload Requested'
        : 'Application Rejected';
    const notifMsg =
      action === 'APPROVE'
        ? 'Congratulations! Your provider account has been approved by Admin. You are now live and can receive appointments.'
        : action === 'REQUEST_CLARITY'
        ? `Admin requested updated KYC documents: ${reason || 'Please upload clear legible copies.'}`
        : `Your provider application could not be approved: ${reason || 'Verification requirements were not met.'}`;

    await SupabaseDb.insertOne('notifications', {
      user_id: existing.user_id,
      type: action === 'APPROVE' ? 'PROVIDER_VERIFIED' : 'SYSTEM_ALERT',
      title: notifTitle,
      message: notifMsg,
      data: { providerId, status: newStatus, reason: reason || null },
    }).catch(() => {});

    SupabaseDb.broadcastSync('provider_kyc_updated', {
      providerId,
      userId: existing.user_id,
      verificationStatus: newStatus,
      rejectionReason: updated?.rejection_reason || null,
    });
    SupabaseDb.broadcastSync('providers_updated', { providerId });

    const userRow = await SupabaseDb.selectOne<any>('users', `select=*&id=eq.${encodeURIComponent(existing.user_id)}`);
    return mapProviderDto(updated, { user: userRow });
  }

  static async verifyDocument(docId: string, isVerified: boolean, adminUserId: string) {
    const doc = await SupabaseDb.updateOne<any>('provider_documents', docId, {
      is_verified: Boolean(isVerified),
    });
    if (!doc) throw new Error('Document not found');

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: isVerified ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_FLAGGED',
      entity_type: 'ProviderDocument',
      entity_id: docId,
      details: JSON.stringify({ documentType: doc.document_type, isVerified }),
    }).catch(() => {});

    SupabaseDb.broadcastSync('providers_updated', { providerId: doc.provider_id });
    return mapDocumentDto(doc);
  }

  static async getAllBookings(status?: string) {
    const filters = ['select=*', 'order=created_at.desc'];
    if (status && status !== 'ALL') {
      filters.push(`status=eq.${encodeURIComponent(status)}`);
    }
    const rows = await SupabaseDb.select<any>('bookings', filters.join('&'));
    if (rows.length === 0) return [];

    const customerIds = Array.from(new Set(rows.map((b) => b.customer_id).filter(Boolean)));
    const providerIds = Array.from(new Set(rows.map((b) => b.provider_id).filter(Boolean)));
    const serviceIds = Array.from(new Set(rows.map((b) => b.service_id).filter(Boolean)));

    const [customers, providers, services] = await Promise.all([
      customerIds.length > 0 ? SupabaseDb.select<any>('customer_profiles', `select=*&id=in.(${customerIds.join(',')})`) : Promise.resolve([]),
      providerIds.length > 0 ? SupabaseDb.select<any>('provider_profiles', `select=*&id=in.(${providerIds.join(',')})`) : Promise.resolve([]),
      serviceIds.length > 0 ? SupabaseDb.select<any>('services', `select=*&id=in.(${serviceIds.join(',')})`) : Promise.resolve([]),
    ]);

    const userIds = Array.from(
      new Set([...customers.map((c) => c.user_id), ...providers.map((p) => p.user_id)].filter(Boolean))
    );
    const users =
      userIds.length > 0
        ? await SupabaseDb.select<any>('users', `select=id,full_name,phone,email&id=in.(${userIds.join(',')})`)
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    const custMap = new Map(customers.map((c) => [c.id, mapCustomerDto(c, userMap.get(c.user_id))]));
    const provMap = new Map(providers.map((p) => [p.id, mapProviderDto(p, { user: userMap.get(p.user_id) })]));
    const servMap = new Map(services.map((s) => [s.id, s]));

    return rows.map((b) =>
      mapBookingDto(b, {
        service: servMap.get(b.service_id),
        customer: custMap.get(b.customer_id),
        provider: provMap.get(b.provider_id),
      })
    );
  }

  static async setCommission(rate: number, type: CommissionType = CommissionType.PERCENTAGE, categoryId?: string) {
    return SupabaseDb.insertOne<any>('commission_settings', {
      rate,
      type,
      category_id: categoryId || null,
      is_active: true,
    });
  }

  static async getCommissionSettings() {
    return SupabaseDb.select<any>('commission_settings', 'select=*&order=created_at.desc');
  }

  static async getAuditLogs() {
    const logs = await SupabaseDb.select<any>('audit_logs', 'select=*&order=created_at.desc&limit=100');
    const userIds = Array.from(new Set(logs.map((l) => l.user_id).filter(Boolean)));
    const users =
      userIds.length > 0
        ? await SupabaseDb.select<any>('users', `select=id,full_name,phone,email&id=in.(${userIds.join(',')})`)
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    return logs.map((l) => mapAuditLogDto(l, userMap.get(l.user_id)));
  }

  static async getCustomers(search?: string) {
    const custRows = await SupabaseDb.select<any>('customer_profiles', 'select=*&order=created_at.desc');
    if (custRows.length === 0) return [];

    const userIds = Array.from(new Set(custRows.map((c) => c.user_id).filter(Boolean)));
    const custIds = custRows.map((c) => c.id);

    const [users, bookings] = await Promise.all([
      userIds.length > 0
        ? SupabaseDb.select<any>('users', `select=id,full_name,email,phone,avatar_url,is_active,created_at&id=in.(${userIds.join(',')})`)
        : Promise.resolve([]),
      SupabaseDb.select<any>('bookings', `select=id,customer_id&customer_id=in.(${custIds.join(',')})`),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const countMap = new Map<string, number>();
    for (const b of bookings) {
      countMap.set(b.customer_id, (countMap.get(b.customer_id) || 0) + 1);
    }

    let hydrated = custRows.map((c) => mapCustomerDto(c, userMap.get(c.user_id), countMap.get(c.id) || 0));

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      hydrated = hydrated.filter(
        (c) =>
          c?.user?.fullName?.toLowerCase().includes(q) ||
          c?.user?.phone?.toLowerCase().includes(q) ||
          c?.user?.email?.toLowerCase().includes(q) ||
          c?.city?.toLowerCase().includes(q)
      );
    }

    return hydrated;
  }

  static async updateCustomerStatus(customerId: string, isActive: boolean, adminUserId: string) {
    const cust = await SupabaseDb.selectOne<any>('customer_profiles', `select=*&id=eq.${encodeURIComponent(customerId)}`);
    if (!cust) throw new Error('Customer profile not found');

    const updatedUser = await SupabaseDb.updateOne<any>('users', cust.user_id, {
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString(),
    });

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: isActive ? 'CUSTOMER_ACTIVATED' : 'CUSTOMER_SUSPENDED',
      entity_type: 'CustomerProfile',
      entity_id: customerId,
      details: JSON.stringify({ isActive }),
    }).catch(() => {});

    SupabaseDb.broadcastSync('customers_updated', { customerId, userId: cust.user_id });
    return mapCustomerDto(cust, updatedUser);
  }

  static async getPendingRates() {
    const rates = await SupabaseDb.select<any>('provider_service_rates', 'select=*&order=created_at.desc');
    if (rates.length === 0) return [];

    const servIds = Array.from(new Set(rates.map((r) => r.service_id).filter(Boolean)));
    const provIds = Array.from(new Set(rates.map((r) => r.provider_id).filter(Boolean)));

    const [services, providers] = await Promise.all([
      servIds.length > 0 ? SupabaseDb.select<any>('services', `select=*&id=in.(${servIds.join(',')})`) : Promise.resolve([]),
      provIds.length > 0 ? SupabaseDb.select<any>('provider_profiles', `select=*&id=in.(${provIds.join(',')})`) : Promise.resolve([]),
    ]);
    const servMap = new Map(services.map((s) => [s.id, s]));
    const provMap = new Map(providers.map((p) => [p.id, p]));

    return rates.map((r) => ({
      ...r,
      approvalStatus: r.approval_status,
      customPrice: r.custom_price,
      service: servMap.get(r.service_id) || null,
      provider: provMap.get(r.provider_id) || null,
    }));
  }

  static async decideRateCard(rateId: string, action: 'APPROVE' | 'REJECT', adminUserId: string, reason?: string) {
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const updated = await SupabaseDb.updateOne<any>('provider_service_rates', rateId, {
      approval_status: status,
      is_active: action === 'APPROVE',
    });
    if (!updated) throw new Error('Rate card not found');

    const [provider, service] = await Promise.all([
      SupabaseDb.selectOne<any>('provider_profiles', `select=*&id=eq.${encodeURIComponent(updated.provider_id)}`),
      SupabaseDb.selectOne<any>('services', `select=*&id=eq.${encodeURIComponent(updated.service_id)}`),
    ]);

    if (provider?.user_id) {
      await SupabaseDb.insertOne('notifications', {
        user_id: provider.user_id,
        type: 'SYSTEM_ALERT',
        title: action === 'APPROVE' ? 'Service Approved by Admin!' : 'Service Request Update',
        message: action === 'APPROVE'
          ? `Your service "${service?.name || 'Service'}" (₹${updated.custom_price || service?.base_price}) has been approved by admin and is now LIVE for customers to book!`
          : `Your service "${service?.name || 'Service'}" request was rejected.${reason ? ' Reason: ' + reason : ''}`,
        data: { rateId, status, serviceName: service?.name },
      }).catch(() => {});
    }

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: `RATE_CARD_${status}`,
      entity_type: 'ProviderServiceRate',
      entity_id: rateId,
      details: JSON.stringify({ status, reason: reason || null, serviceName: service?.name }),
    }).catch(() => {});

    SupabaseDb.broadcastSync('rates_updated', { rateId, status, providerId: updated.provider_id });
    SupabaseDb.broadcastSync('catalog_updated', { entity: 'rate_card', id: rateId });
    return updated;
  }

  static async getRefunds() {
    const refunds = await SupabaseDb.select<any>('refunds', 'select=*&order=created_at.desc');
    if (refunds.length === 0) return [];
    const bookingIds = Array.from(new Set(refunds.map((r) => r.booking_id).filter(Boolean)));
    const bookings =
      bookingIds.length > 0
        ? await SupabaseDb.select<any>('bookings', `select=id,booking_ref,total_amount,customer_id&id=in.(${bookingIds.join(',')})`)
        : [];
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));
    return refunds.map((r) => ({ ...r, booking: bookingMap.get(r.booking_id) || null }));
  }

  static async getPayouts() {
    const batches = await SupabaseDb.select<any>('payout_batches', 'select=*&order=created_at.desc');
    const items = await SupabaseDb.select<any>('payout_items', 'select=*');
    return batches.map((b) => ({
      ...b,
      items: items.filter((i) => i.batch_id === b.id),
    }));
  }

  static async generatePayoutBatch(adminUserId: string) {
    const unsettled = await SupabaseDb.select<any>('provider_earnings', 'select=*&is_settled=eq.false');
    if (unsettled.length === 0) throw new Error('No unsettled earnings eligible for payout');

    const totalAmount = unsettled.reduce((sum, e) => sum + Number(e.net_earnings || 0), 0);
    const grouped = new Map<string, number>();
    for (const e of unsettled) {
      grouped.set(e.provider_id, (grouped.get(e.provider_id) || 0) + Number(e.net_earnings || 0));
    }

    const batchRef = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const batch = await SupabaseDb.insertOne<any>('payout_batches', {
      batch_ref: batchRef,
      total_amount: totalAmount,
      status: 'GENERATED',
    });

    const itemRows = Array.from(grouped.entries()).map(([providerId, netAmount]) => ({
      batch_id: batch.id,
      provider_id: providerId,
      net_amount: netAmount,
      status: 'PENDING',
    }));
    const items = await SupabaseDb.insert<any>('payout_items', itemRows);

    await SupabaseDb.update(
      'provider_earnings',
      `id=in.(${unsettled.map((u) => u.id).join(',')})`,
      { is_settled: true, settled_at: new Date().toISOString() }
    );

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: 'PAYOUT_BATCH_GENERATED',
      entity_type: 'PayoutBatch',
      entity_id: batch.id,
      details: JSON.stringify({ batchRef, totalAmount, count: unsettled.length }),
    }).catch(() => {});

    return { ...batch, items };
  }

  static async markPayoutPaid(itemId: string, bankTxRef: string, adminUserId: string) {
    const item = await SupabaseDb.updateOne<any>('payout_items', itemId, {
      status: 'PAID',
      bank_tx_ref: bankTxRef,
      paid_at: new Date().toISOString(),
    });
    if (!item) throw new Error('Payout item not found');

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: 'PAYOUT_ITEM_PAID',
      entity_type: 'PayoutItem',
      entity_id: itemId,
      details: JSON.stringify({ bankTxRef, netAmount: item.net_amount }),
    }).catch(() => {});

    return item;
  }

  static async getSupportTickets(status?: string) {
    const filters = ['select=*', 'order=created_at.desc'];
    if (status && status !== 'ALL') filters.push(`status=eq.${encodeURIComponent(status)}`);
    const tickets = await SupabaseDb.select<any>('support_tickets', filters.join('&'));
    if (tickets.length === 0) return [];

    const userIds = Array.from(new Set(tickets.map((t) => t.user_id).filter(Boolean)));
    const ticketIds = tickets.map((t) => t.id);

    const [users, messages] = await Promise.all([
      userIds.length > 0 ? SupabaseDb.select<any>('users', `select=id,full_name,phone,email&id=in.(${userIds.join(',')})`) : Promise.resolve([]),
      SupabaseDb.select<any>('ticket_messages', `select=*&ticket_id=in.(${ticketIds.join(',')})&order=created_at.asc`).catch(() => []),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    return tickets.map((t) => ({
      ...t,
      ticketRef: t.ticket_ref,
      user: userMap.get(t.user_id) || null,
      messages: messages.filter((m) => m.ticket_id === t.id),
    }));
  }

  static async resolveSupportTicket(ticketId: string, resolution: string, adminUserId: string) {
    const ticket = await SupabaseDb.updateOne<any>('support_tickets', ticketId, {
      status: 'RESOLVED',
      resolution,
      updated_at: new Date().toISOString(),
    });
    if (!ticket) throw new Error('Support ticket not found');

    await SupabaseDb.insertOne('ticket_messages', {
      ticket_id: ticketId,
      sender_id: adminUserId,
      sender_role: 'ADMIN',
      message: `Resolution: ${resolution}`,
    }).catch(() => {});

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: 'SUPPORT_TICKET_RESOLVED',
      entity_type: 'SupportTicket',
      entity_id: ticketId,
      details: JSON.stringify({ resolution }),
    }).catch(() => {});

    await SupabaseDb.insertOne('notifications', {
      user_id: ticket.user_id,
      type: 'SYSTEM_ALERT',
      title: `Support Ticket Resolved (${ticket.ticket_ref})`,
      message: resolution,
      data: { ticketId },
    }).catch(() => {});

    return ticket;
  }

  // =========================================================================
  // SYSTEM SETTINGS & BANNERS (100% DB-backed, replaces Admin localStorage)
  // =========================================================================
  private static parseSettingValue<T>(raw: any, fallback: T): T {
    if (raw === null || raw === undefined) return fallback;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    }
    return raw as T;
  }

  private static mapBannerRow(row: any) {
    if (!row) return row;
    return {
      ...row,
      ctaText: row.ctaText ?? row.cta_text ?? 'Book Now',
      imageUrl: row.imageUrl ?? row.image_url ?? '',
      targetScreen: row.targetScreen ?? row.target_screen ?? 'Search',
      displayOrder: row.displayOrder ?? row.display_order ?? 0,
      isActive: row.isActive ?? row.is_active ?? true,
    };
  }

  static async getSettings() {
    const rows = await SupabaseDb.select<any>('system_settings', 'select=*');
    const map: Record<string, any> = {};
    for (const r of rows) {
      map[r.key] = this.parseSettingValue<any>(r.value, null);
    }
    return {
      booking_settings: map.booking_settings || {
        slotDurationMinutes: 30,
        maxAdvanceBookingDays: 30,
        minCancellationNoticeHours: 2,
        allowInstantBooking: true,
        requireOtpVerification: true,
        providerAcceptSlaMinutes: 5,
      },
      payment_settings: map.payment_settings || {
        platformCommissionPercent: 15,
        taxPercent: 18,
        minPayoutThreshold: 500,
        payoutCycle: 'T+1',
        razorpayEnabled: true,
        cashOnServiceEnabled: true,
      },
    };
  }

  static async updateSetting(key: string, value: Record<string, any>, adminUserId: string) {
    const allowedKeys = ['booking_settings', 'payment_settings'];
    if (!allowedKeys.includes(key)) {
      throw new Error(`Invalid settings key: ${key}`);
    }

    const rows = await SupabaseDb.upsert<any>(
      'system_settings',
      {
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description: `Updated by admin (${adminUserId})`,
        updated_at: new Date().toISOString(),
      },
      'key'
    );

    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: 'SYSTEM_SETTING_UPDATED',
      entity_type: 'SystemSetting',
      entity_id: key,
      details: JSON.stringify(value),
    }).catch(() => {});

    SupabaseDb.broadcastSync('settings_updated', { key });
    const row = rows[0];
    return row ? { ...row, value: this.parseSettingValue(row.value, value) } : row;
  }

  static async getBanners(activeOnly = false) {
    const DEFAULT_PROMO_BANNERS = [
      {
        id: 'promo-banner-1',
        title: 'Spa & Salon at Home',
        subtitle: 'Relax & Rejuvenate - Book Spa & Salon Services',
        cta_text: 'Book Now',
        image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
        target_screen: 'Category',
        city: 'All Cities',
        display_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'promo-banner-2',
        title: 'Home Cleaning Experts',
        subtitle: 'Flat ₹200 OFF on First Full House Deep Cleaning',
        cta_text: 'Claim Offer',
        image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
        target_screen: 'Category',
        city: 'All Cities',
        display_order: 2,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'promo-banner-3',
        title: 'AC Service & Repair',
        subtitle: 'Summer Special - Multi-point diagnostic check from ₹399',
        cta_text: 'Explore',
        image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
        target_screen: 'Category',
        city: 'All Cities',
        display_order: 3,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    try {
      const filter = activeOnly
        ? 'select=*&is_active=eq.true&order=display_order.asc,created_at.desc'
        : 'select=*&order=display_order.asc,created_at.desc';
      const rows = await SupabaseDb.select<any>('banners', filter);
      if (rows && rows.length > 0) {
        return rows.map((r) => this.mapBannerRow(r));
      }
    } catch {}

    try {
      const setting = await SupabaseDb.selectOne<any>('system_settings', 'select=*&key=eq.promotional_banners');
      let list = this.parseSettingValue<any[]>(setting?.value, []);
      if (!Array.isArray(list) || list.length === 0) {
        list = DEFAULT_PROMO_BANNERS;
        await SupabaseDb.upsert(
          'system_settings',
          {
            key: 'promotional_banners',
            value: JSON.stringify(DEFAULT_PROMO_BANNERS),
            updated_at: new Date().toISOString(),
          },
          'key'
        ).catch(() => {});
      }
      const filtered = activeOnly
        ? list.filter((b: any) => b.is_active !== false && b.isActive !== false)
        : list;
      return filtered.map((b) => this.mapBannerRow(b));
    } catch {
      return DEFAULT_PROMO_BANNERS.map((b) => this.mapBannerRow(b));
    }
  }

  static async createBanner(payload: any, adminUserId: string) {
    const newBanner = {
      title: String(payload.title || '').trim(),
      subtitle: String(payload.subtitle || '').trim(),
      cta_text: String(payload.ctaText || payload.cta_text || 'Book Now').trim(),
      image_url: String(payload.imageUrl || payload.image_url || '').trim(),
      target_screen: String(payload.targetScreen || payload.target_screen || 'Search'),
      city: String(payload.city || 'All Cities'),
      display_order: Number(payload.displayOrder ?? payload.display_order ?? 0),
      is_active: payload.isActive !== false && payload.is_active !== false,
    };

    try {
      const created = await SupabaseDb.insertOne<any>('banners', newBanner);
      await SupabaseDb.insertOne('audit_logs', {
        user_id: adminUserId,
        action: 'BANNER_CREATED',
        entity_type: 'Banner',
        entity_id: created.id,
        details: JSON.stringify({ title: created.title }),
      }).catch(() => {});
      SupabaseDb.broadcastSync('banners_updated', { id: created.id });
      return this.mapBannerRow(created);
    } catch (err: any) {
      if (err instanceof SupabaseDbError && err.code === 'PGRST205') {
        const existing = await this.getBanners(false);
        const created = { id: crypto.randomUUID(), ...newBanner, created_at: new Date().toISOString() };
        await SupabaseDb.upsert(
          'system_settings',
          {
            key: 'promotional_banners',
            value: JSON.stringify([created, ...existing]),
            updated_at: new Date().toISOString(),
          },
          'key'
        );
        SupabaseDb.broadcastSync('banners_updated', { id: created.id });
        return this.mapBannerRow(created);
      }
      throw err;
    }
  }

  static async updateBanner(id: string, payload: any, adminUserId: string) {
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (payload.title !== undefined) patch.title = payload.title;
    if (payload.subtitle !== undefined) patch.subtitle = payload.subtitle;
    if (payload.ctaText !== undefined || payload.cta_text !== undefined) {
      patch.cta_text = payload.ctaText ?? payload.cta_text;
    }
    if (payload.imageUrl !== undefined || payload.image_url !== undefined) {
      patch.image_url = payload.imageUrl ?? payload.image_url;
    }
    if (payload.city !== undefined) patch.city = payload.city;
    if (payload.isActive !== undefined || payload.is_active !== undefined) {
      patch.is_active = Boolean(payload.isActive ?? payload.is_active);
    }

    try {
      const updated = await SupabaseDb.updateOne<any>('banners', id, patch);
      SupabaseDb.broadcastSync('banners_updated', { id });
      return this.mapBannerRow(updated);
    } catch (err: any) {
      if (err instanceof SupabaseDbError && err.code === 'PGRST205') {
        const existing = await this.getBanners(false);
        const nextList = existing.map((b: any) => (b.id === id ? { ...b, ...patch } : b));
        await SupabaseDb.upsert(
          'system_settings',
          {
            key: 'promotional_banners',
            value: JSON.stringify(nextList),
            updated_at: new Date().toISOString(),
          },
          'key'
        );
        SupabaseDb.broadcastSync('banners_updated', { id });
        return this.mapBannerRow(nextList.find((b: any) => b.id === id) || null);
      }
      throw err;
    }
  }

  static async deleteBanner(id: string, adminUserId: string) {
    try {
      await SupabaseDb.remove('banners', `id=eq.${encodeURIComponent(id)}`);
    } catch (err: any) {
      if (err instanceof SupabaseDbError && err.code === 'PGRST205') {
        const existing = await this.getBanners(false);
        const nextList = existing.filter((b: any) => b.id !== id);
        await SupabaseDb.upsert(
          'system_settings',
          {
            key: 'promotional_banners',
            value: JSON.stringify(nextList),
            updated_at: new Date().toISOString(),
          },
          'key'
        );
      } else {
        throw err;
      }
    }
    await SupabaseDb.insertOne('audit_logs', {
      user_id: adminUserId,
      action: 'BANNER_DELETED',
      entity_type: 'Banner',
      entity_id: id,
    }).catch(() => {});
    SupabaseDb.broadcastSync('banners_updated', { id });
    return { deleted: true };
  }

  static async getBroadcastNotifications() {
    const rows = await SupabaseDb.select<any>('notifications', 'select=*&order=created_at.desc&limit=100');
    const seen = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.title}::${r.message}::${String(r.created_at).slice(0, 16)}`;
      if (!seen.has(key)) {
        seen.set(key, {
          id: r.id,
          title: r.title,
          message: r.message,
          type: r.type,
          audience: r.data?.audience || 'Direct / System',
          createdAt: r.created_at,
          recipientsCount: 1,
        });
      } else {
        seen.get(key).recipientsCount += 1;
      }
    }
    return Array.from(seen.values());
  }
}
