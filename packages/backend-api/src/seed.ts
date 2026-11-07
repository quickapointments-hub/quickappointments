import { prisma } from './prisma';

async function main() {
  console.log('Seeding Quick Appointments database with production-grade seed data...');

  // 1. Create Super Admin User
  const adminUser = await prisma.user.upsert({
    where: { phone: '+919999900001' },
    update: {},
    create: {
      phone: '+919999900001',
      email: 'admin@quickappointments.com',
      fullName: 'Super Administrator',
      roles: {
        create: [
          { role: 'ADMIN' },
          { role: 'SUPERADMIN' },
        ],
      },
      adminProfile: {
        create: {
          department: 'Executive Operations',
          permissions: 'ALL',
        },
      },
    },
  });
  console.log('Created Admin User:', adminUser.fullName);

  // 2. Create the 4 Launch Categories (Phase 6.4 Requirement)
  const categoriesData = [
    {
      name: 'Salon & Grooming',
      slug: 'salon-grooming',
      description: 'Haircuts, beard detailing, luxury facial care & styling',
      displayOrder: 1,
      services: [
        { name: 'Executive Haircut & Beard Sculpt', slug: 'executive-haircut-beard', description: 'Precision styling, beard shaping, hot towel & wash', durationMinutes: 45, basePrice: 499 },
        { name: 'Deep Cleanse Organic Facial', slug: 'organic-facial', description: 'Pore cleansing, exfoliating peel and revitalizing mask', durationMinutes: 60, basePrice: 899 },
        { name: 'Bridal & Groom Complete Spa', slug: 'bridal-groom-spa', description: 'Full body rejuvenating massage, scrub and glow treatment', durationMinutes: 120, basePrice: 2499 },
      ]
    },
    {
      name: 'Healthcare & Wellness',
      slug: 'healthcare-wellness',
      description: 'Certified doctors, physiotherapy, holistic therapy & nutrition',
      displayOrder: 2,
      services: [
        { name: 'General Physician Consultation', slug: 'gp-consultation', description: 'Comprehensive diagnostic review, vital checks & prescriptions', durationMinutes: 30, basePrice: 599 },
        { name: 'Ergonomic Physiotherapy Session', slug: 'ergonomic-physio', description: 'Targeted spine, neck and joint mobility therapy', durationMinutes: 45, basePrice: 799 },
        { name: 'Clinical Nutrition & Diet Consultation', slug: 'nutrition-diet-plan', description: 'Metabolic evaluation, custom diet chart & follow-up', durationMinutes: 40, basePrice: 650 },
      ]
    },
    {
      name: 'Home Repairs & AC Services',
      slug: 'home-repairs-ac',
      description: 'Master technicians for HVAC, electrical, plumbing & maintenance',
      displayOrder: 3,
      services: [
        { name: 'AC Comprehensive Deep Jet Service', slug: 'ac-jet-service', description: 'Indoor & outdoor coil cleaning, pressure check & anti-bacterial foam', durationMinutes: 60, basePrice: 699 },
        { name: 'Complete Home Electrical Safety Inspection', slug: 'electrical-safety-check', description: 'Circuit breaker diagnosis, earthing test & appliance audit', durationMinutes: 60, basePrice: 450 },
        { name: 'Plumbing Leak Detection & Pipe Repair', slug: 'plumbing-leak-repair', description: 'High-pressure line inspection, sealant & replacement', durationMinutes: 45, basePrice: 399 },
      ]
    },
    {
      name: 'Auto Care & Detailing',
      slug: 'auto-care-detailing',
      description: 'Professional foam wash, ceramic polish & mechanical tune-up',
      displayOrder: 4,
      services: [
        { name: '3-Layer Ceramic Coating & Paint Seal', slug: 'ceramic-coating', description: 'Hydrophobic protection, machine polish & scratch minimization', durationMinutes: 180, basePrice: 4999 },
        { name: 'Interior Steam Clean & Odor Sterilization', slug: 'interior-steam-clean', description: 'Upholstery shampooing, dashboard shine & HVAC ozone purification', durationMinutes: 90, basePrice: 1299 },
        { name: 'Complete 30-Point Vehicle Health Inspection', slug: 'vehicle-health-check', description: 'Brakes, fluid, battery, OBD scanner & suspension check', durationMinutes: 60, basePrice: 799 },
      ]
    }
  ];

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
    });

    for (const s of cat.services) {
      await prisma.service.upsert({
        where: { slug: s.slug },
        update: {},
        create: {
          categoryId: createdCat.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          durationMinutes: s.durationMinutes,
          basePrice: s.basePrice,
          isActive: true,
        },
      });
    }
  }
  console.log('Created 4 Categories & Catalog Services');

  // 3. Create Sample Providers (Individual & Business)
  const providerData = [
    {
      phone: '+919876500001',
      fullName: 'Vikram Sethi',
      businessName: 'Studio Precision Salon',
      type: 'BUSINESS',
      city: 'Mumbai',
      address: 'Shop 14, High Street Mall, Bandra West',
      status: 'APPROVED',
      experienceYears: 8,
      ratingAvg: 4.9,
      ratingCount: 142,
    },
    {
      phone: '+919876500002',
      fullName: 'Dr. Ananya Roy',
      businessName: 'Dr. Roy Wellness & Physio',
      type: 'INDIVIDUAL',
      city: 'Bengaluru',
      address: 'Suite 201, Indiranagar 100ft Road',
      status: 'APPROVED',
      experienceYears: 11,
      ratingAvg: 4.95,
      ratingCount: 218,
    },
    {
      phone: '+919876500003',
      fullName: 'Rajesh Sharma',
      businessName: 'CoolBreeze HVAC Techs',
      type: 'BUSINESS',
      city: 'Delhi NCR',
      address: 'B-42, Sector 18, Noida',
      status: 'APPROVED',
      experienceYears: 6,
      ratingAvg: 4.8,
      ratingCount: 95,
    },
    {
      phone: '+919876500004',
      fullName: 'Karthik Nair',
      businessName: 'Karthik Auto Pro',
      type: 'INDIVIDUAL',
      city: 'Chennai',
      address: 'No 88, Anna Salai',
      status: 'PENDING', // Pending verification for admin KYC testing
      experienceYears: 4,
      ratingAvg: 5.0,
      ratingCount: 12,
    },
  ];

  for (const p of providerData) {
    const user = await prisma.user.upsert({
      where: { phone: p.phone },
      update: {},
      create: {
        phone: p.phone,
        fullName: p.fullName,
        roles: {
          create: [{ role: 'PROVIDER' }, { role: 'CUSTOMER' }],
        },
      },
    });

    const providerProfile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: p.businessName,
        providerType: p.type,
        city: p.city,
        address: p.address,
        verificationStatus: p.status,
        experienceYears: p.experienceYears,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        isAcceptingBookings: p.status === 'APPROVED',
      },
    });

    // Add Documents
    await prisma.providerDocument.createMany({
      data: [
        {
          providerId: providerProfile.id,
          documentType: 'GOVERNMENT_ID',
          documentNumber: 'XXXX-XXXX-4512',
          fileUrl: '/uploads/sample_id_aadhaar.png',
          isVerified: p.status === 'APPROVED',
        },
        {
          providerId: providerProfile.id,
          documentType: 'TRADE_LICENSE',
          documentNumber: 'TL-2024-8891',
          fileUrl: '/uploads/sample_license.png',
          isVerified: p.status === 'APPROVED',
        },
      ],
    });

    // Add Weekly Working Hours (Mon to Sat 09:00 - 18:00, lunch 13:00 - 14:00, Sun closed)
    for (let day = 0; day <= 6; day++) {
      await prisma.providerWorkingHour.upsert({
        where: {
          providerId_dayOfWeek: {
            providerId: providerProfile.id,
            dayOfWeek: day,
          },
        },
        update: {},
        create: {
          providerId: providerProfile.id,
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: '19:00',
          breakStart: '13:00',
          breakEnd: '14:00',
          isClosed: day === 0, // Sunday closed
        },
      });
    }
  }
  console.log('Created Sample Providers with Documents & Availability');

  // 4. Create Sample Customer with Active Booking
  const customerUser = await prisma.user.upsert({
    where: { phone: '+919811122233' },
    update: {},
    create: {
      phone: '+919811122233',
      fullName: 'Pooja Verma',
      roles: {
        create: [{ role: 'CUSTOMER' }],
      },
      customer: {
        create: {
          city: 'Mumbai',
          defaultAddress: 'Flat 402, Sea Breeze Apts, Bandra West',
        },
      },
    },
    include: { customer: true },
  });

  // Assign Services to First Provider
  const firstProvider = await prisma.providerProfile.findFirst({
    where: { verificationStatus: 'APPROVED' },
  });
  const firstService = await prisma.service.findFirst();

  if (firstProvider && firstService && customerUser.customer) {
    await prisma.providerServiceRate.upsert({
      where: {
        providerId_serviceId: {
          providerId: firstProvider.id,
          serviceId: firstService.id,
        },
      },
      update: {},
      create: {
        providerId: firstProvider.id,
        serviceId: firstService.id,
        customPrice: firstService.basePrice,
      },
    });

    // Create a confirmed booking
    const today = new Date().toISOString().split('T')[0];
    await prisma.booking.upsert({
      where: { bookingRef: 'QA-2026-0001' },
      update: {},
      create: {
        bookingRef: 'QA-2026-0001',
        customerId: customerUser.customer.id,
        providerId: firstProvider.id,
        serviceId: firstService.id,
        date: today,
        startTime: '11:00',
        endTime: '12:00',
        servicePrice: firstService.basePrice,
        taxAmount: Math.round(firstService.basePrice * 0.05),
        totalAmount: firstService.basePrice + Math.round(firstService.basePrice * 0.05),
        platformCommission: Math.round(firstService.basePrice * 0.1),
        providerEarnings: (firstService.basePrice + Math.round(firstService.basePrice * 0.05)) - Math.round(firstService.basePrice * 0.1),
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'CASH_ON_SERVICE',
      },
    });
  }

  // 5. Create Default Platform Commission Setting (10%)
  await prisma.commissionSetting.create({
    data: {
      rate: 10.0,
      type: 'PERCENTAGE',
      isActive: true,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
