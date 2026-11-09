import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase } from './src/supabase';

// Brand tokens
const COLORS = {
  bg: '#111114',
  card: '#1C1C22',
  cardElevated: '#24242C',
  border: '#2E2E38',
  primary: '#65B32E',
  primaryLight: '#7DE838',
  primaryDim: 'rgba(101, 179, 46, 0.15)',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  blue: '#3B82F6',
};

// Initial Mock Data
const CATEGORIES = [
  { id: 'all', name: 'All Services', icon: '⚡' },
  { id: 'salon', name: 'Salon & Grooming', icon: '💇' },
  { id: 'spa', name: 'Spa & Wellness', icon: '💆' },
  { id: 'clinic', name: 'Doctor & Clinic', icon: '🩺' },
  { id: 'cleaning', name: 'Cleaning & Repairs', icon: '🧹' },
  { id: 'fitness', name: 'Fitness & Yoga', icon: '🧘' },
  { id: 'car', name: 'Auto Care & Wash', icon: '🚗' },
];

const INITIAL_PROVIDERS = [
  {
    id: 'p1',
    name: 'Glow Elite Salon & Spa',
    category: 'salon',
    categoryName: 'Salon & Grooming',
    rating: 4.9,
    reviewsCount: 142,
    distance: '1.2 km away',
    services: [
      { id: 's1', name: 'Precision Haircut & Styling', price: 399, duration: '45m' },
      { id: 's2', name: 'Detoxifying Hydra Facial', price: 899, duration: '60m' },
      { id: 's3', name: 'Beard Sculpt & Head Massage', price: 299, duration: '30m' },
    ],
    nextSlot: 'Today at 03:00 PM',
  },
  {
    id: 'p2',
    name: 'Dr. Mehta Ortho & Wellness',
    category: 'clinic',
    categoryName: 'Doctor & Clinic',
    rating: 4.95,
    reviewsCount: 318,
    distance: '2.5 km away',
    services: [
      { id: 's4', name: 'Orthopedic Consultation', price: 500, duration: '30m' },
      { id: 's5', name: 'Physiotherapy & Spine Rehab', price: 750, duration: '45m' },
    ],
    nextSlot: 'Today at 04:30 PM',
  },
  {
    id: 'p3',
    name: 'SparklePro Deep Cleaning',
    category: 'cleaning',
    categoryName: 'Cleaning & Repairs',
    rating: 4.85,
    reviewsCount: 89,
    distance: '3.0 km away',
    services: [
      { id: 's6', name: 'Full Bathroom Deep Clean', price: 699, duration: '90m' },
      { id: 's7', name: 'Kitchen Chimney & Gas Degrease', price: 849, duration: '60m' },
      { id: 's8', name: '2BHK Complete Home Sanitization', price: 1899, duration: '180m' },
    ],
    nextSlot: 'Tomorrow at 10:00 AM',
  },
];

const TIME_SLOTS = [
  '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'
];

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [activeRole, setActiveRole] = useState<'customer' | 'provider'>('customer');
  const [userName, setUserName] = useState('Aman Verma');

  // Customer State
  const [customerTab, setCustomerTab] = useState<'explore' | 'bookings' | 'profile'>('explore');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isPaying, setIsPaying] = useState(false);

  // Bookings state (shared)
  const [bookings, setBookings] = useState<any[]>([
    {
      id: 'BK-1082',
      serviceName: 'Precision Haircut & Styling',
      providerName: 'Glow Elite Salon & Spa',
      customerName: 'Aman Verma',
      customerPhone: '9876543210',
      slot: 'Today, 03:00 PM',
      amount: 419,
      status: 'CONFIRMED',
      deliveryOtp: '482915',
      createdAt: new Date().toLocaleTimeString(),
    },
  ]);

  // Provider State
  const [providerTab, setProviderTab] = useState<'dashboard' | 'schedule' | 'earnings' | 'profile'>('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [slaCountdown, setSlaCountdown] = useState(120);
  const [pendingJob, setPendingJob] = useState<any>({
    id: 'BK-9941',
    customerName: 'Priya Sharma',
    customerPhone: '9811223344',
    serviceName: 'Detoxifying Hydra Facial',
    slot: 'Today, 04:30 PM',
    amount: 899,
    distance: '1.4 km',
    deliveryOtp: '739102',
  });
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [providerEarnings, setProviderEarnings] = useState(2840);
  const [completedJobsCount, setCompletedJobsCount] = useState(4);

  // SLA countdown timer
  useEffect(() => {
    let interval: any = null;
    if (pendingJob && slaCountdown > 0) {
      interval = setInterval(() => {
        setSlaCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pendingJob, slaCountdown]);

  // Status bar styling
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    if ((StatusBar as any).setBackgroundColor) {
      (StatusBar as any).setBackgroundColor(COLORS.bg, true);
    }
  }, []);

  // Auth Handler
  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsOtpSent(true);
    setOtp('123456');
    Alert.alert('OTP Sent', 'Default Verification OTP: 123456 (Pre-filled for rapid testing)');
  };

  const handleVerifyOtp = () => {
    if (otp !== '123456') {
      Alert.alert('Incorrect OTP', 'Please enter default OTP 123456');
      return;
    }
    setIsAuthenticated(true);
  };

  // Booking Flow
  const openBookingModal = (provider: any, service: any) => {
    setSelectedProvider(provider);
    setSelectedService(service);
    setSelectedSlot(TIME_SLOTS[0]);
    setBookingModalVisible(true);
  };

  const handleProceedToPayment = () => {
    setBookingModalVisible(false);
    setRazorpayModalVisible(true);
  };

  const handleSimulateRazorpaySuccess = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setRazorpayModalVisible(false);

      // Generate a random 6-digit delivery OTP for service completion
      const generatedDeliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const newBooking = {
        id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceName: selectedService.name,
        providerName: selectedProvider.name,
        customerName: userName,
        customerPhone: phoneNumber,
        slot: `Today, ${selectedSlot}`,
        amount: selectedService.price + 20,
        status: 'CONFIRMED',
        deliveryOtp: generatedDeliveryOtp,
        createdAt: new Date().toLocaleTimeString(),
      };

      setBookings((prev) => [newBooking, ...prev]);

      // Also trigger incoming pending job for provider view
      setPendingJob({
        id: newBooking.id,
        customerName: userName,
        customerPhone: phoneNumber,
        serviceName: selectedService.name,
        slot: `Today, ${selectedSlot}`,
        amount: selectedService.price,
        distance: selectedProvider.distance,
        deliveryOtp: generatedDeliveryOtp,
      });
      setSlaCountdown(120);

      Alert.alert(
        '🎉 Payment Successful!',
        `Booking Confirmed via Razorpay!\n\nYour 6-Digit Delivery OTP is: ${generatedDeliveryOtp}\n\nShare this OTP with the specialist only after your service is completed.`,
        [
          {
            text: 'View My Bookings',
            onPress: () => setCustomerTab('bookings'),
          },
        ]
      );
    }, 1200);
  };

  // Provider SLA Actions
  const handleAcceptJob = () => {
    Alert.alert('Job Accepted', 'You have accepted the booking. Proceed to client location.');
    // Move to active bookings
    setBookings((prev) =>
      prev.map((b) => (b.id === pendingJob?.id ? { ...b, status: 'IN_PROGRESS' } : b))
    );
  };

  const handleRejectJob = () => {
    Alert.alert('Booking Declined', 'The request has been routed to the next available specialist.');
    setPendingJob(null);
  };

  const handleVerifyDeliveryOtp = () => {
    if (!verifyOtpInput || verifyOtpInput.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit delivery OTP provided by the customer.');
      return;
    }

    // Verify against pending job or active bookings
    const matched = bookings.find((b) => b.deliveryOtp === verifyOtpInput) ||
      (pendingJob && pendingJob.deliveryOtp === verifyOtpInput ? pendingJob : null);

    if (matched) {
      Alert.alert('✅ OTP Verified!', `Service completed successfully! ₹${matched.amount} credited to your earnings.`);
      setProviderEarnings((prev) => prev + matched.amount);
      setCompletedJobsCount((prev) => prev + 1);
      setBookings((prev) =>
        prev.map((b) => (b.deliveryOtp === verifyOtpInput ? { ...b, status: 'COMPLETED' } : b))
      );
      if (pendingJob && pendingJob.deliveryOtp === verifyOtpInput) {
        setPendingJob(null);
      }
      setVerifyOtpInput('');
    } else {
      Alert.alert('Verification Failed', 'Incorrect OTP. Ask the customer to check the OTP shown on their Bookings screen.');
    }
  };

  // ----------------------------------------------------
  // AUTH SCREEN
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.brandContainer}>
            <View style={styles.brandIconWrapper}>
              <Text style={styles.brandIconText}>⚡</Text>
            </View>
            <Text style={styles.brandTitle}>Quick Appointments</Text>
            <Text style={styles.brandSubtitle}>Fast, Verified & Instant Local Services</Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.authCardTitle}>
              {isOtpSent ? 'Verify Mobile OTP' : 'Login / Register'}
            </Text>
            <Text style={styles.authCardDesc}>
              {isOtpSent
                ? 'Enter the 6-digit verification code sent to your phone'
                : 'Enter your phone number to get instant access'}
            </Text>

            {!isOtpSent ? (
              <>
                <Text style={styles.inputLabel}>Mobile Phone Number</Text>
                <View style={styles.phoneInputRow}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="9876543210"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSendOtp}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Send OTP Code</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.demoOtpBanner}>
                  <Text style={styles.demoOtpTitle}>🔑 Demo Mode Notice:</Text>
                  <Text style={styles.demoOtpText}>
                    Default OTP is <Text style={{ fontWeight: 'bold', color: COLORS.primaryLight }}>123456</Text> (Pre-filled below)
                  </Text>
                </View>

                <Text style={styles.inputLabel}>6-Digit OTP</Text>
                <TextInput
                  style={[styles.textInput, styles.otpInput]}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="123456"
                  placeholderTextColor={COLORS.textMuted}
                />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleVerifyOtp}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Verify & Proceed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setIsOtpSent(false)}
                >
                  <Text style={styles.linkButtonText}>Change Mobile Number</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.rolePickerBox}>
              <Text style={styles.rolePickerLabel}>Select Mode:</Text>
              <View style={styles.rolePills}>
                <TouchableOpacity
                  style={[
                    styles.rolePill,
                    activeRole === 'customer' && styles.rolePillActive,
                  ]}
                  onPress={() => setActiveRole('customer')}
                >
                  <Text
                    style={[
                      styles.rolePillText,
                      activeRole === 'customer' && styles.rolePillTextActive,
                    ]}
                  >
                    👤 Customer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.rolePill,
                    activeRole === 'provider' && styles.rolePillActive,
                  ]}
                  onPress={() => setActiveRole('provider')}
                >
                  <Text
                    style={[
                      styles.rolePillText,
                      activeRole === 'provider' && styles.rolePillTextActive,
                    ]}
                  >
                    💼 Provider
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // MAIN APP SCREEN (CUSTOMER & PROVIDER)
  // ----------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header & Role Switcher */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <Text style={styles.logoBadge}>⚡ QA</Text>
          <View>
            <Text style={styles.topHeaderTitle}>Quick Appointments</Text>
            <Text style={styles.topHeaderSub}>
              {activeRole === 'customer' ? 'Customer App' : 'Provider Partner App'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.roleSwitchBtn}
          onPress={() => {
            const next = activeRole === 'customer' ? 'provider' : 'customer';
            setActiveRole(next);
            Alert.alert('Role Switched', `Switched to ${next.toUpperCase()} mode.`);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.roleSwitchText}>
            ⇄ {activeRole === 'customer' ? 'Provider' : 'Customer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY CONTENT */}
      {activeRole === 'customer' ? (
        // ---------------- CUSTOMER MODE ----------------
        <View style={styles.body}>
          {customerTab === 'explore' && (
            <ScrollView style={styles.scrollContent}>
              {/* Search Bar */}
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search salons, clinics, cleaners..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Categories Horizontal Scroll */}
              <Text style={styles.sectionHeader}>Categories</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catPill,
                        isSelected && styles.catPillActive,
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={styles.catIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.catText,
                          isSelected && styles.catTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Providers List */}
              <Text style={styles.sectionHeader}>Top Rated Specialists</Text>
              {INITIAL_PROVIDERS.filter(
                (p) =>
                  (selectedCategory === 'all' || p.category === selectedCategory) &&
                  p.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((provider) => (
                <View key={provider.id} style={styles.providerCard}>
                  <View style={styles.providerHeader}>
                    <View>
                      <Text style={styles.providerName}>{provider.name}</Text>
                      <Text style={styles.providerCategory}>
                        {provider.categoryName} • {provider.distance}
                      </Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {provider.rating}</Text>
                    </View>
                  </View>

                  <View style={styles.slotIndicatorBox}>
                    <Text style={styles.slotDot}>🟢</Text>
                    <Text style={styles.slotIndicatorText}>
                      Next Available: {provider.nextSlot}
                    </Text>
                  </View>

                  {/* Services under provider */}
                  <View style={styles.servicesDivider} />
                  {provider.services.map((svc) => (
                    <View key={svc.id} style={styles.serviceRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceName}>{svc.name}</Text>
                        <Text style={styles.serviceDuration}>⏱️ {svc.duration}</Text>
                      </View>
                      <Text style={styles.servicePrice}>₹{svc.price}</Text>
                      <TouchableOpacity
                        style={styles.bookSlotBtn}
                        onPress={() => openBookingModal(provider, svc)}
                      >
                        <Text style={styles.bookSlotBtnText}>Book Slot</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}

              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {customerTab === 'bookings' && (
            <ScrollView style={styles.scrollContent}>
              <Text style={styles.screenTitle}>My Appointments & Bookings</Text>
              {bookings.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>📅</Text>
                  <Text style={styles.emptyTitle}>No active bookings</Text>
                  <Text style={styles.emptySub}>
                    Explore top-rated services and book your first instant slot!
                  </Text>
                </View>
              ) : (
                bookings.map((booking) => (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingCardTop}>
                      <View>
                        <Text style={styles.bookingId}>Booking #{booking.id}</Text>
                        <Text style={styles.bookingService}>{booking.serviceName}</Text>
                        <Text style={styles.bookingProvider}>🏢 {booking.providerName}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          booking.status === 'COMPLETED'
                            ? styles.statusCompleted
                            : styles.statusConfirmed,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>{booking.status}</Text>
                      </View>
                    </View>

                    <View style={styles.bookingInfoRow}>
                      <Text style={styles.bookingTime}>🕒 {booking.slot}</Text>
                      <Text style={styles.bookingAmount}>Paid: ₹{booking.amount}</Text>
                    </View>

                    {/* C-08 Delivery OTP Card */}
                    {booking.status !== 'COMPLETED' && (
                      <View style={styles.deliveryOtpContainer}>
                        <View style={styles.deliveryOtpHeader}>
                          <Text style={styles.deliveryOtpTitle}>
                            🔑 Service Delivery OTP (C-08)
                          </Text>
                          <Text style={styles.deliveryOtpSub}>
                            Show to provider upon service completion
                          </Text>
                        </View>
                        <View style={styles.otpBox}>
                          <Text style={styles.otpDigits}>{booking.deliveryOtp}</Text>
                        </View>
                      </View>
                    )}

                    {booking.status !== 'COMPLETED' && (
                      <View style={styles.bookingActionRow}>
                        <TouchableOpacity
                          style={styles.cancelActionBtn}
                          onPress={() => {
                            Alert.alert(
                              'Cancel Appointment?',
                              'Are you sure you want to cancel this booking? Refund will be credited within 2 hours.',
                              [
                                { text: 'No, Keep Slot', style: 'cancel' },
                                {
                                  text: 'Yes, Cancel',
                                  style: 'destructive',
                                  onPress: () => {
                                    setBookings((prev) =>
                                      prev.map((b) =>
                                        b.id === booking.id ? { ...b, status: 'CANCELLED' } : b
                                      )
                                    );
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Text style={styles.cancelActionText}>Cancel Booking</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rescheduleActionBtn}
                          onPress={() =>
                            Alert.alert('Reschedule Slot', 'Select another slot from the provider page.')
                          }
                        >
                          <Text style={styles.rescheduleActionText}>Reschedule</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {customerTab === 'profile' && (
            <ScrollView style={styles.scrollContent}>
              <View style={styles.profileHeaderBox}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>👤</Text>
                </View>
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profilePhone}>+91 {phoneNumber}</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>✓ Verified Mobile User</Text>
                </View>
              </View>

              <View style={styles.profileMenuBox}>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => Alert.alert('Saved Addresses', 'Home: Flat 402, Green Valley Apartments')}
                >
                  <Text style={styles.menuItemText}>📍 Saved Addresses</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => Alert.alert('Payment Methods', 'Default: Simulated UPI / Razorpay Test Mode')}
                >
                  <Text style={styles.menuItemText}>💳 Payment Methods</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => Alert.alert('Help & Support', 'Support Hotline: support@quickappointments.com')}
                >
                  <Text style={styles.menuItemText}>💬 24/7 Customer Support</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profileMenuItem, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    setIsAuthenticated(false);
                    setIsOtpSent(false);
                  }}
                >
                  <Text style={[styles.menuItemText, { color: COLORS.danger }]}>🚪 Log Out</Text>
                  <Text style={[styles.menuItemArrow, { color: COLORS.danger }]}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* Customer Bottom Navigation */}
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCustomerTab('explore')}
            >
              <Text style={[styles.navIcon, customerTab === 'explore' && styles.navActive]}>
                ⚡
              </Text>
              <Text style={[styles.navText, customerTab === 'explore' && styles.navActiveText]}>
                Explore
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCustomerTab('bookings')}
            >
              <Text style={[styles.navIcon, customerTab === 'bookings' && styles.navActive]}>
                📅
              </Text>
              <Text style={[styles.navText, customerTab === 'bookings' && styles.navActiveText]}>
                Bookings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setCustomerTab('profile')}
            >
              <Text style={[styles.navIcon, customerTab === 'profile' && styles.navActive]}>
                👤
              </Text>
              <Text style={[styles.navText, customerTab === 'profile' && styles.navActiveText]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // ---------------- PROVIDER MODE ----------------
        <View style={styles.body}>
          {providerTab === 'dashboard' && (
            <ScrollView style={styles.scrollContent}>
              {/* Online / Offline Toggle */}
              <View style={styles.statusToggleBar}>
                <View>
                  <Text style={styles.statusToggleTitle}>
                    {isOnline ? '🟢 Online & Receiving Requests' : '⚪ Offline'}
                  </Text>
                  <Text style={styles.statusToggleSub}>
                    {isOnline ? 'Visible to nearby customers' : 'You are currently unavailable'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleBtn, isOnline ? styles.toggleBtnOn : styles.toggleBtnOff]}
                  onPress={() => setIsOnline(!isOnline)}
                >
                  <Text style={styles.toggleBtnText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
                </TouchableOpacity>
              </View>

              {/* SLA Incoming Booking Card */}
              {pendingJob && (
                <View style={styles.slaCard}>
                  <View style={styles.slaHeaderRow}>
                    <View style={styles.slaTag}>
                      <Text style={styles.slaTagText}>⚡ URGENT REQUEST (S-06)</Text>
                    </View>
                    <Text style={styles.slaTimerText}>
                      ⏱️ {Math.floor(slaCountdown / 60)}:
                      {(slaCountdown % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>

                  <Text style={styles.slaCustomerName}>{pendingJob.customerName}</Text>
                  <Text style={styles.slaService}>{pendingJob.serviceName}</Text>
                  <Text style={styles.slaDetails}>
                    📍 {pendingJob.distance} • Slot: {pendingJob.slot}
                  </Text>
                  <Text style={styles.slaPayout}>Payout: ₹{pendingJob.amount}</Text>

                  <View style={styles.slaActionButtons}>
                    <TouchableOpacity
                      style={styles.slaAcceptBtn}
                      onPress={handleAcceptJob}
                    >
                      <Text style={styles.slaAcceptBtnText}>✓ Accept Job (2m SLA)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.slaRejectBtn}
                      onPress={handleRejectJob}
                    >
                      <Text style={styles.slaRejectBtnText}>✕ Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Verify Customer Delivery OTP Card */}
              <View style={styles.verifyOtpCard}>
                <Text style={styles.verifyOtpCardTitle}>
                  🔐 Complete Job via Delivery OTP (P-07)
                </Text>
                <Text style={styles.verifyOtpCardSub}>
                  Ask customer for the 6-digit OTP shown on their screen to complete job & unlock payout
                </Text>

                <View style={styles.verifyOtpInputRow}>
                  <TextInput
                    style={styles.verifyOtpTextInput}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={COLORS.textMuted}
                    value={verifyOtpInput}
                    onChangeText={setVerifyOtpInput}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.verifyOtpSubmitBtn}
                    onPress={handleVerifyDeliveryOtp}
                  >
                    <Text style={styles.verifyOtpSubmitBtnText}>Verify</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Metrics Grid */}
              <Text style={styles.sectionHeader}>Today's Performance</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Total Earnings</Text>
                  <Text style={styles.metricValue}>₹{providerEarnings}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Jobs Completed</Text>
                  <Text style={styles.metricValue}>{completedJobsCount}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Acceptance Rate</Text>
                  <Text style={styles.metricValue}>98.5%</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Rating</Text>
                  <Text style={styles.metricValue}>⭐ 4.95</Text>
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {providerTab === 'schedule' && (
            <ScrollView style={styles.scrollContent}>
              <Text style={styles.screenTitle}>Availability & Slot Manager</Text>
              <Text style={styles.screenSub}>
                Manage your working hours and toggle available slots
              </Text>

              {['Morning Slots (09:00 - 12:00)', 'Afternoon Slots (12:00 - 04:00)', 'Evening Slots (04:00 - 08:00)'].map(
                (period, idx) => (
                  <View key={idx} style={styles.slotGroupCard}>
                    <Text style={styles.slotGroupTitle}>{period}</Text>
                    <View style={styles.slotPillsRow}>
                      {['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'].map((s, i) => (
                        <View key={i} style={styles.slotActivePill}>
                          <Text style={styles.slotActivePillText}>✓ {s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {providerTab === 'earnings' && (
            <ScrollView style={styles.scrollContent}>
              <Text style={styles.screenTitle}>Earnings & Payouts</Text>
              <View style={styles.payoutCard}>
                <Text style={styles.payoutLabel}>Available for Bank Transfer</Text>
                <Text style={styles.payoutAmount}>₹{providerEarnings}</Text>
                <TouchableOpacity
                  style={styles.payoutBtn}
                  onPress={() =>
                    Alert.alert(
                      'Payout Initiated',
                      `₹${providerEarnings} transfer initiated to HDFC Bank (A/C ending in **4921). Arrives in 15 mins.`
                    )
                  }
                >
                  <Text style={styles.payoutBtnText}>⚡ Transfer to Bank Account</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionHeader}>Recent Transactions</Text>
              {bookings
                .filter((b) => b.status === 'COMPLETED')
                .map((b) => (
                  <View key={b.id} style={styles.transactionItem}>
                    <View>
                      <Text style={styles.transactionTitle}>{b.serviceName}</Text>
                      <Text style={styles.transactionTime}>{b.customerName} • {b.slot}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>+₹{b.amount}</Text>
                  </View>
                ))}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {providerTab === 'profile' && (
            <ScrollView style={styles.scrollContent}>
              <View style={styles.profileHeaderBox}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>💼</Text>
                </View>
                <Text style={styles.profileName}>Glow Elite Provider Hub</Text>
                <Text style={styles.profilePhone}>+91 {phoneNumber}</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>🛡️ KYC Verified Partner</Text>
                </View>
              </View>

              <View style={styles.profileMenuBox}>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => Alert.alert('KYC Documents', 'Aadhaar Card: VERIFIED\nPAN Card: VERIFIED\nBank Account: VERIFIED')}
                >
                  <Text style={styles.menuItemText}>📄 KYC Verification Status</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => Alert.alert('Bank Account', 'HDFC Bank - A/C: *******4921 (IFSC: HDFC0001234)')}
                >
                  <Text style={styles.menuItemText}>🏦 Bank Account Settings</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profileMenuItem, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    setIsAuthenticated(false);
                    setIsOtpSent(false);
                  }}
                >
                  <Text style={[styles.menuItemText, { color: COLORS.danger }]}>🚪 Log Out</Text>
                  <Text style={[styles.menuItemArrow, { color: COLORS.danger }]}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* Provider Bottom Navigation */}
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setProviderTab('dashboard')}
            >
              <Text style={[styles.navIcon, providerTab === 'dashboard' && styles.navActive]}>
                📊
              </Text>
              <Text style={[styles.navText, providerTab === 'dashboard' && styles.navActiveText]}>
                Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setProviderTab('schedule')}
            >
              <Text style={[styles.navIcon, providerTab === 'schedule' && styles.navActive]}>
                ⏱️
              </Text>
              <Text style={[styles.navText, providerTab === 'schedule' && styles.navActiveText]}>
                Schedule
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setProviderTab('earnings')}
            >
              <Text style={[styles.navIcon, providerTab === 'earnings' && styles.navActive]}>
                💰
              </Text>
              <Text style={[styles.navText, providerTab === 'earnings' && styles.navActiveText]}>
                Earnings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setProviderTab('profile')}
            >
              <Text style={[styles.navIcon, providerTab === 'profile' && styles.navActive]}>
                👤
              </Text>
              <Text style={[styles.navText, providerTab === 'profile' && styles.navActiveText]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ---------------------------------------------------- */}
      {/* BOOKING MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Booking Slot</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedProvider && selectedService && (
              <ScrollView>
                <Text style={styles.modalProvider}>{selectedProvider.name}</Text>
                <Text style={styles.modalService}>{selectedService.name}</Text>
                <Text style={styles.modalPrice}>Service Fee: ₹{selectedService.price}</Text>

                <Text style={styles.slotPickerTitle}>Select Preferred Slot Time:</Text>
                <View style={styles.slotGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotBtn,
                          isSelected && styles.slotBtnSelected,
                        ]}
                        onPress={() => setSelectedSlot(slot)}
                      >
                        <Text
                          style={[
                            styles.slotBtnText,
                            isSelected && styles.slotBtnTextSelected,
                          ]}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Bill Breakdown */}
                <View style={styles.billBox}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>₹{selectedService.price}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Platform & Convenience Fee</Text>
                    <Text style={styles.billValue}>₹20</Text>
                  </View>
                  <View style={[styles.billRow, styles.billTotalRow]}>
                    <Text style={styles.billTotalLabel}>Total Payable</Text>
                    <Text style={styles.billTotalValue}>₹{selectedService.price + 20}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={handleProceedToPayment}
                >
                  <Text style={styles.checkoutBtnText}>Proceed to Razorpay (₹{selectedService.price + 20})</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ---------------------------------------------------- */}
      {/* SIMULATED RAZORPAY PAYMENT MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal
        visible={razorpayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRazorpayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.razorpayContainer]}>
            <View style={styles.razorpayHeader}>
              <View style={styles.razorpayBrand}>
                <Text style={styles.razorpayLogo}>⚡ Razorpay</Text>
                <View style={styles.razorpayTestBadge}>
                  <Text style={styles.razorpayTestText}>TEST SIMULATION</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setRazorpayModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedService && (
              <View style={styles.razorpayBody}>
                <Text style={styles.razorpayAmount}>
                  Pay ₹{selectedService.price + 20}
                </Text>
                <Text style={styles.razorpayMerchant}>
                  Merchant: Quick Appointments Hub
                </Text>

                <Text style={styles.paymentMethodTitle}>Select Payment Option:</Text>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'upi' && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentMethod('upi')}
                >
                  <Text style={styles.paymentOptionIcon}>📱</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentOptionTitle}>UPI Instant Payment</Text>
                    <Text style={styles.paymentOptionSub}>Google Pay, PhonePe, Paytm</Text>
                  </View>
                  {paymentMethod === 'upi' && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'card' && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentMethod('card')}
                >
                  <Text style={styles.paymentOptionIcon}>💳</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentOptionTitle}>Credit / Debit Card</Text>
                    <Text style={styles.paymentOptionSub}>Visa, MasterCard, RuPay</Text>
                  </View>
                  {paymentMethod === 'card' && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'netbanking' && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentMethod('netbanking')}
                >
                  <Text style={styles.paymentOptionIcon}>🏦</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentOptionTitle}>Net Banking</Text>
                    <Text style={styles.paymentOptionSub}>HDFC, ICICI, SBI, Axis</Text>
                  </View>
                  {paymentMethod === 'netbanking' && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.razorpayPayBtn}
                  onPress={handleSimulateRazorpaySuccess}
                  disabled={isPaying}
                >
                  {isPaying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.razorpayPayBtnText}>
                      Simulate Success Payment (₹{selectedService.price + 20})
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.razorpaySecurityText}>
                  🔒 Secured with 256-bit encryption • Sandbox Mode
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Auth
  authScroll: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  brandIconText: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  authCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  authCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  authCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: COLORS.text,
  },
  otpInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  demoOtpBanner: {
    backgroundColor: COLORS.primaryDim,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  demoOtpTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },
  demoOtpText: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  linkButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  rolePickerBox: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rolePickerLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  rolePills: {
    flexDirection: 'row',
    gap: 10,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  rolePillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  rolePillTextActive: {
    color: COLORS.primaryLight,
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  topHeaderSub: {
    fontSize: 11,
    color: COLORS.primaryLight,
  },
  roleSwitchBtn: {
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Customer Explore
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: COLORS.text,
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  catPillActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  catIcon: {
    fontSize: 14,
  },
  catText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  catTextActive: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
  },

  // Provider Card
  providerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  providerCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  slotIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  slotDot: {
    fontSize: 8,
  },
  slotIndicatorText: {
    fontSize: 12,
    color: COLORS.primaryLight,
  },
  servicesDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  serviceDuration: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginRight: 12,
  },
  bookSlotBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookSlotBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },

  // Customer Bookings
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  screenSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  bookingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 14,
  },
  bookingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingId: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  bookingService: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  bookingProvider: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bookingTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bookingAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },

  // C-08 Delivery OTP Card
  deliveryOtpContainer: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  deliveryOtpHeader: {
    marginBottom: 8,
  },
  deliveryOtpTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },
  deliveryOtpSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  otpBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpDigits: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 6,
    color: COLORS.text,
  },
  bookingActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
  },
  rescheduleActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
  },
  rescheduleActionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Provider SLA & Dashboard
  statusToggleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusToggleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusToggleSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleBtnOn: {
    backgroundColor: COLORS.primary,
  },
  toggleBtnOff: {
    backgroundColor: COLORS.border,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },

  slaCard: {
    backgroundColor: '#1E1710',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  slaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slaTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  slaTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
  slaTimerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
  slaCustomerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 10,
  },
  slaService: {
    fontSize: 14,
    color: COLORS.primaryLight,
    marginTop: 2,
  },
  slaDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  slaPayout: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  slaActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  slaAcceptBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  slaAcceptBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  slaRejectBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  slaRejectBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.danger,
  },

  verifyOtpCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifyOtpCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  verifyOtpCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  verifyOtpInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  verifyOtpTextInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifyOtpSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyOtpSubmitBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 6,
  },

  // Schedule & Earnings
  slotGroupCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotGroupTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  slotPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotActivePill: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  slotActivePillText: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  payoutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 14,
  },
  payoutLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  payoutAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginVertical: 8,
  },
  payoutBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  payoutBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  transactionTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },

  // Profile
  profileHeaderBox: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 30,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profilePhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verifiedTag: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  verifiedTagText: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: 'bold',
  },
  profileMenuBox: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  menuItemArrow: {
    fontSize: 18,
    color: COLORS.textMuted,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  navActive: {
    color: COLORS.primaryLight,
  },
  navText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  navActiveText: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseText: {
    fontSize: 20,
    color: COLORS.textMuted,
    padding: 4,
  },
  modalProvider: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  modalService: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  modalPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginTop: 4,
  },
  slotPickerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 10,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotBtnSelected: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  slotBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  slotBtnTextSelected: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
  },
  billBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: 12,
    color: COLORS.text,
  },
  billTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  billTotalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },

  // Razorpay
  razorpayContainer: {
    backgroundColor: '#0C1B2A',
    borderTopColor: '#1A365D',
  },
  razorpayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  razorpayBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  razorpayLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  razorpayTestBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  razorpayTestText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  razorpayBody: {
    paddingBottom: 20,
  },
  razorpayAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  razorpayMerchant: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#CBD5E1',
    marginBottom: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  paymentOptionActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0F172A',
  },
  paymentOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentOptionSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  razorpayPayBtn: {
    backgroundColor: '#0284C7',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  razorpayPayBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  razorpaySecurityText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
  },
});
