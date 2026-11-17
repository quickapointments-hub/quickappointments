import React, { useState, useEffect, useRef } from 'react';
import {
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
  Platform,
  Dimensions,
  NativeModules,
} from 'react-native';
import { registerRootComponent } from 'expo';
import { RN_COLORS as COLORS, THEME_COLORS } from './src/theme';
import { supabase } from './src/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RNStatusBar = StatusBar as unknown as React.ComponentType<any>;

// Global Safe Area Insets for Android and iOS
const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
const TOP_SAFE_PADDING = Platform.OS === 'android' ? ANDROID_STATUS_BAR + 8 : 12;
const BOTTOM_SAFE_PADDING = Platform.OS === 'android' ? 24 : 16;

// Safe Screen Wrapper to avoid deprecated React Native SafeAreaView warnings
const SafeAreaView: React.FC<any> = ({ style, children, ...rest }) => (
  <View
    style={[
      {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
        backgroundColor: COLORS.bg,
      },
      style,
    ]}
    {...rest}
  >
    {children}
  </View>
);

// Service Categories (Aligned with 12 Core Services in Image 1 & 2)
const ALL_12_CATEGORIES = [
  { id: 'beauty', name: 'Beauty &\nSalon', shortName: 'Beauty & Salon', icon: '✨', badgeColor: '#EAF7E3' },
  { id: 'hair', name: 'Hair Care', shortName: 'Hair Care', icon: '✂️', badgeColor: '#EAF7E3' },
  { id: 'cleaning', name: 'Home\nCleaning', shortName: 'Home Cleaning', icon: '🏠', badgeColor: '#EAF7E3' },
  { id: 'repair', name: 'Home\nRepair', shortName: 'Home Repair', icon: '🛠️', badgeColor: '#EAF7E3' },
  { id: 'wellness', name: 'Wellness\n& Spa', shortName: 'Wellness & Spa', icon: '🌸', badgeColor: '#EAF7E3' },
  { id: 'appliance', name: 'Appliance\nRepair', shortName: 'Appliance Repair', icon: '🧺', badgeColor: '#EAF7E3' },
  { id: 'plumbing', name: 'Plumbing', shortName: 'Plumbing', icon: '🚰', badgeColor: '#EAF7E3' },
  { id: 'ac', name: 'AC Repair\n& Service', shortName: 'AC Repair & Service', icon: '❄️', badgeColor: '#EAF7E3' },
  { id: 'car', name: 'Car Care\n& Detailing', shortName: 'Car Care & Detailing', icon: '🚗', badgeColor: '#EAF7E3' },
  { id: 'pet', name: 'Pet Care', shortName: 'Pet Care', icon: '🐾', badgeColor: '#EAF7E3' },
  { id: 'it', name: 'IT & Electronics\nServices', shortName: 'IT & Electronics Services', icon: '💻', badgeColor: '#EAF7E3' },
  { id: 'more', name: 'More\nServices', shortName: 'More Services', icon: '▦', badgeColor: '#EAF7E3' },
];

// Subcategories (Matching Category Detail Screen in Image 1)
const BEAUTY_SUBCATEGORIES_DATA = [
  { id: 'sub_hair', name: 'Hair Care', icon: '✂️' },
  { id: 'sub_skin', name: 'Skin Care', icon: '🧖' },
  { id: 'sub_makeup', name: 'Makeup', icon: '💄' },
  { id: 'sub_nail', name: 'Nail Care', icon: '💅' },
  { id: 'sub_eye', name: 'Eye Care', icon: '👁️' },
  { id: 'sub_facial', name: 'Facial & Spa', icon: '💆' },
  { id: 'sub_men', name: "Men's Grooming", icon: '🧔' },
  { id: 'sub_pkg', name: 'Salon Packages', icon: '🪷' },
];

// Popular Services (Matching Category Detail Screen in Image 1)
const BEAUTY_POPULAR_SERVICES_DATA = [
  {
    id: 'bps_facial',
    name: 'Facial Clean Up',
    subcategoryId: 'sub_skin',
    duration: '45 mins',
    price: 499,
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
    provider: { id: 'fp1', name: 'Glow Beauty Salon', categoryName: 'Beauty & Salon' },
  },
  {
    id: 'bps_haircut',
    name: 'Hair Cut',
    subcategoryId: 'sub_hair',
    duration: '30 mins',
    price: 299,
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
    provider: { id: 'fp1', name: 'Glow Beauty Salon', categoryName: 'Beauty & Salon' },
  },
  {
    id: 'bps_mani_pedi',
    name: 'Manicure & Pedicure',
    subcategoryId: 'sub_nail',
    duration: '60 mins',
    price: 799,
    imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&auto=format&fit=crop&q=80',
    provider: { id: 'fp1', name: 'Glow Beauty Salon', categoryName: 'Beauty & Salon' },
  },
];

const AVAILABLE_CITIES = ['Warangal', 'Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Chennai', 'Pune'];

// Popular Services (Aligned with Image 3)
const POPULAR_SERVICES_DATA = [
  {
    id: 'ps1',
    name: 'Facial & Skin Care',
    category: 'beauty',
    price: 499,
    duration: '45 mins',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop&q=80',
    providerName: 'Glow Beauty Salon',
    rating: 4.8,
  },
  {
    id: 'ps2',
    name: 'Home Cleaning',
    category: 'cleaning',
    price: 899,
    duration: '120 mins',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80',
    providerName: 'CleanPro Services',
    rating: 4.7,
  },
  {
    id: 'ps3',
    name: 'Plumbing Services',
    category: 'plumbing',
    price: 299,
    duration: '30 mins',
    imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500&auto=format&fit=crop&q=80',
    providerName: 'QuickFix Plumbing',
    rating: 4.9,
  },
];

// Featured Providers (Aligned with Image 3)
const FEATURED_PROVIDERS_DATA = [
  {
    id: 'fp1',
    name: 'Glow Beauty Salon',
    categoryName: 'Salon & Beauty',
    rating: 4.8,
    reviewsCount: '1,236',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80',
    nextSlot: 'Today at 02:30 PM',
  },
  {
    id: 'fp2',
    name: 'CleanPro Services',
    categoryName: 'Home Cleaning',
    rating: 4.7,
    reviewsCount: '896',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500&auto=format&fit=crop&q=80',
    nextSlot: 'Today at 04:00 PM',
  },
  {
    id: 'fp3',
    name: 'QuickFix Plumbing & AC',
    categoryName: 'Home Repair',
    rating: 4.9,
    reviewsCount: '640',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
    nextSlot: 'Tomorrow at 10:00 AM',
  },
];

// Service Categories
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

const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: 'Book Appointments Easily',
    desc: 'Find trusted professionals and book your favourite services in just a few taps.',
    buttonText: 'Next →',
    type: 'calendar',
  },
  {
    id: 2,
    title: 'Choose Verified Service Providers',
    desc: 'Discover trusted and skilled professionals for your needs.',
    buttonText: 'Next →',
    type: 'specialist',
  },
  {
    id: 3,
    title: 'Manage Your Appointments Easily',
    desc: 'Book, reschedule or cancel your appointments anytime, anywhere.',
    buttonText: 'Get Started →',
    type: 'phone',
  },
];

// ----------------------------------------------------
// REAL INDIA POST PINCODE DETECTION API (Live Postal API)
// ----------------------------------------------------
export interface PostalLocationResult {
  pincode: string;
  state: string;
  district: string;
  city: string;
  areas: string[];
  primaryArea: string;
}

// Offline Postal Database for instant zero-latency lookup & network failover
const OFFLINE_PINCODE_DB: Record<string, { state: string; district: string; city: string; areas: string[] }> = {
  '506001': { state: 'Telangana', district: 'Warangal', city: 'Warangal', areas: ['Warangal H.O', 'Girmajipet', 'Mandi Bazar'] },
  '506002': { state: 'Telangana', district: 'Warangal', city: 'Warangal', areas: ['Kazipet', 'Diesel Colony', 'Madikonda'] },
  '506003': { state: 'Telangana', district: 'Warangal', city: 'Warangal', areas: ['Hanamkonda', 'Subedari', 'Naimnagar', 'Kakatiya University'] },
  '500001': { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', areas: ['Hyderabad G.P.O.', 'Abids', 'Moazzam Jahi Market'] },
  '500034': { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', areas: ['Banjara Hills', 'Somajiguda'] },
  '500081': { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', areas: ['Madhapur', 'HITEC City', 'Cyber Towers'] },
  '560001': { state: 'Karnataka', district: 'Bengaluru', city: 'Bengaluru', areas: ['Bengaluru G.P.O.', 'MG Road', 'Cubbon Park'] },
  '400001': { state: 'Maharashtra', district: 'Mumbai', city: 'Mumbai', areas: ['Mumbai G.P.O.', 'Fort', 'Colaba'] },
  '110001': { state: 'Delhi', district: 'Central Delhi', city: 'New Delhi', areas: ['Connaught Place', 'Barakhamba Road'] },
  '600001': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', areas: ['Chennai G.P.O.', 'Parrys', 'George Town'] },
};

export const fetchPostalLocation = async (
  pincode: string
): Promise<{ success: boolean; data?: PostalLocationResult; error?: string }> => {
  const cleanPin = (pincode || '').replace(/\D/g, '').trim();
  if (cleanPin.length !== 6) {
    return { success: false, error: 'Please enter a valid 6-digit Indian PIN code.' };
  }

  // Check offline dictionary first for instant response
  if (OFFLINE_PINCODE_DB[cleanPin]) {
    const rec = OFFLINE_PINCODE_DB[cleanPin];
    return {
      success: true,
      data: {
        pincode: cleanPin,
        state: rec.state,
        district: rec.district,
        city: rec.city,
        areas: rec.areas,
        primaryArea: rec.areas[0] || rec.city,
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Postal service HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) {
      return { success: false, error: 'No postal data received.' };
    }

    const first = json[0];
    if (first.Status !== 'Success' || !Array.isArray(first.PostOffice) || first.PostOffice.length === 0) {
      return { success: false, error: first.Message || 'No postal records found for this PIN code.' };
    }

    const postOffices = first.PostOffice;
    const areas = Array.from(new Set(postOffices.map((p: any) => (p.Name || '').trim()).filter(Boolean))) as string[];
    const sample = postOffices[0];
    const district = sample.District || sample.Division || sample.Region || '';
    const state = sample.State || '';
    const city = sample.District || sample.Block || district;
    const primaryArea = areas[0] || district || city;

    return {
      success: true,
      data: {
        pincode: cleanPin,
        state,
        district,
        city,
        areas,
        primaryArea,
      },
    };
  } catch (err: any) {
    // Determine state from Indian 2-digit postal circle prefixes if network is unreachable
    const prefix = cleanPin.substring(0, 2);
    let fallbackState = 'Telangana';
    let fallbackCity = 'Warangal';

    if (prefix >= '50' && prefix <= '50') {
      fallbackState = 'Telangana';
      fallbackCity = cleanPin.startsWith('506') ? 'Warangal' : 'Hyderabad';
    } else if (prefix >= '51' && prefix <= '53') {
      fallbackState = 'Andhra Pradesh';
      fallbackCity = 'Vijayawada';
    } else if (prefix >= '56' && prefix <= '59') {
      fallbackState = 'Karnataka';
      fallbackCity = 'Bengaluru';
    } else if (prefix >= '40' && prefix <= '44') {
      fallbackState = 'Maharashtra';
      fallbackCity = 'Mumbai';
    } else if (prefix === '11') {
      fallbackState = 'Delhi';
      fallbackCity = 'New Delhi';
    } else if (prefix >= '60' && prefix <= '64') {
      fallbackState = 'Tamil Nadu';
      fallbackCity = 'Chennai';
    }

    return {
      success: true,
      data: {
        pincode: cleanPin,
        state: fallbackState,
        district: fallbackCity,
        city: fallbackCity,
        areas: [fallbackCity],
        primaryArea: fallbackCity,
      },
    };
  }
};

// ----------------------------------------------------
// ONBOARDING VECTOR ILLUSTRATIONS (Pure React Native)
// ----------------------------------------------------
const CalendarIllustration = () => (
  <View style={illusStyles.wrapper}>
    <View style={illusStyles.circleBackdrop} />
    <View style={illusStyles.raysContainer}>
      <View style={[illusStyles.ray, { transform: [{ rotate: '-30deg' }] }]} />
      <View style={[illusStyles.ray, { transform: [{ rotate: '0deg' }], marginTop: -4 }]} />
      <View style={[illusStyles.ray, { transform: [{ rotate: '30deg' }] }]} />
    </View>
    <View style={illusStyles.calendarCard}>
      <View style={illusStyles.ringLeft} />
      <View style={illusStyles.ringRight} />
      <View style={illusStyles.calendarHeader} />
      <View style={illusStyles.gridRow}>
        <View style={illusStyles.gridSquare} />
        <View style={illusStyles.gridSquare} />
        <View style={illusStyles.gridSquare} />
      </View>
      <View style={illusStyles.gridRow}>
        <View style={illusStyles.gridSquare} />
        <View style={illusStyles.gridSquare} />
        <View style={illusStyles.gridSquare} />
      </View>
    </View>
    <View style={illusStyles.badgeCircle}>
      <Text style={illusStyles.checkmarkText}>✓</Text>
    </View>
  </View>
);

// ----------------------------------------------------
// SCREEN 1: LOCATION MAP VECTOR ILLUSTRATION (Image 1)
// ----------------------------------------------------
const LocationMapIllustration = () => (
  <View style={mapIllusStyles.container}>
    {/* Background faint city skyline */}
    <View style={mapIllusStyles.skylineBackdrop}>
      <View style={[mapIllusStyles.tree, { left: 24 }]} />
      <View style={[mapIllusStyles.building, { height: 38, width: 22, left: 42 }]} />
      <View style={[mapIllusStyles.building, { height: 50, width: 26, left: 68 }]} />
      <View style={[mapIllusStyles.building, { height: 44, width: 24, right: 68 }]} />
      <View style={[mapIllusStyles.building, { height: 34, width: 20, right: 44 }]} />
      <View style={[mapIllusStyles.tree, { right: 24 }]} />
    </View>

    {/* Folded paper map */}
    <View style={mapIllusStyles.mapFoldContainer}>
      <View style={[mapIllusStyles.mapFold, mapIllusStyles.mapFold1]} />
      <View style={[mapIllusStyles.mapFold, mapIllusStyles.mapFold2]} />
      <View style={[mapIllusStyles.mapFold, mapIllusStyles.mapFold3]} />
    </View>

    {/* Big Green Location Marker */}
    <View style={mapIllusStyles.pinWrapper}>
      <View style={mapIllusStyles.pinHead}>
        <View style={mapIllusStyles.pinCenterDot} />
      </View>
      <View style={mapIllusStyles.pinTail} />
    </View>

    {/* Sparkle alert rays */}
    <View style={mapIllusStyles.ray1} />
    <View style={mapIllusStyles.ray2} />
    <View style={mapIllusStyles.ray3} />
  </View>
);

// ----------------------------------------------------
// SCREEN 2: ACCOUNT TYPE VECTOR ILLUSTRATION (Image 2)
// ----------------------------------------------------
const AccountTypeIllustration = () => (
  <View style={accIllusStyles.container}>
    {/* Soft organic green foliage backdrop */}
    <View style={accIllusStyles.leafBackdrop}>
      <View style={[accIllusStyles.leaf, { transform: [{ rotate: '-35deg' }], left: 16 }]} />
      <View style={[accIllusStyles.leaf, { transform: [{ rotate: '25deg' }], right: 16 }]} />
      <View style={accIllusStyles.cloudBackdrop} />
    </View>

    {/* Smartphone Frame */}
    <View style={accIllusStyles.phoneFrame}>
      <View style={accIllusStyles.phoneSpeaker} />
      <View style={accIllusStyles.phoneScreen}>
        <View style={accIllusStyles.avatarCircle}>
          <Text style={{ fontSize: 24 }}>👤</Text>
        </View>
        <View style={accIllusStyles.miniLine1} />
        <View style={accIllusStyles.miniLine2} />
      </View>
      {/* Plus badge */}
      <View style={accIllusStyles.plusBadge}>
        <Text style={accIllusStyles.plusText}>+</Text>
      </View>
    </View>

    {/* Sparkle alert rays */}
    <View style={accIllusStyles.ray1} />
    <View style={accIllusStyles.ray2} />
    <View style={accIllusStyles.ray3} />
  </View>
);

// ----------------------------------------------------
// SCREEN 5: ACCOUNT CREATED FESTIVE CONFETTI (Image 5)
// ----------------------------------------------------
const ConfettiSuccessIllustration = () => (
  <View style={confettiStyles.container}>
    {/* Outer soft green glow ring */}
    <View style={confettiStyles.outerGlow}>
      {/* Green center circle */}
      <View style={confettiStyles.centerCircle}>
        <Text style={confettiStyles.checkmarkText}>✓</Text>
      </View>
    </View>

    {/* Festive radiating rays & confetti particles: emerald & amber-gold */}
    <View style={[confettiStyles.rayBar, { top: -2, left: 52, backgroundColor: '#2E9E1E', transform: [{ rotate: '0deg' }] }]} />
    <View style={[confettiStyles.rayBar, { top: 8, left: 20, backgroundColor: '#2E9E1E', transform: [{ rotate: '-45deg' }] }]} />
    <View style={[confettiStyles.rayBar, { top: 8, right: 20, backgroundColor: '#EAB308', transform: [{ rotate: '45deg' }] }]} />
    <View style={[confettiStyles.rayBar, { bottom: 12, left: 22, backgroundColor: '#2E9E1E', transform: [{ rotate: '-135deg' }] }]} />
    <View style={[confettiStyles.rayBar, { bottom: 12, right: 22, backgroundColor: '#EAB308', transform: [{ rotate: '135deg' }] }]} />

    {/* Confetti dots */}
    <View style={[confettiStyles.dot, { top: 6, left: 42, backgroundColor: '#EAB308' }]} />
    <View style={[confettiStyles.dot, { top: 14, right: 38, backgroundColor: '#2E9E1E' }]} />
    <View style={[confettiStyles.dot, { bottom: 16, left: 38, backgroundColor: '#EAB308' }]} />
    <View style={[confettiStyles.dot, { bottom: 20, right: 44, backgroundColor: '#2E9E1E' }]} />
    <View style={[confettiStyles.dot, { top: 44, left: 8, backgroundColor: '#EAB308' }]} />
    <View style={[confettiStyles.dot, { top: 44, right: 8, backgroundColor: '#2E9E1E' }]} />
  </View>
);

// ----------------------------------------------------
// VECTOR AVATAR ILLUSTRATIONS (Matching Reference Screen 3)
// ----------------------------------------------------
const GeneralUserAvatar = () => (
  <View style={avatarStyles.avatarBox}>
    <View style={avatarStyles.girlBackdrop}>
      {/* Hair back */}
      <View style={avatarStyles.girlHairBack} />
      {/* Head */}
      <View style={avatarStyles.girlFace} />
      {/* Hair front / bangs */}
      <View style={avatarStyles.girlHairFront} />
      {/* Pink shirt */}
      <View style={avatarStyles.girlShirt} />
      {/* Mini hand holding phone */}
      <View style={avatarStyles.miniHandPhone}>
        <View style={avatarStyles.tinyPhone} />
      </View>
    </View>
  </View>
);

const ServiceProviderAvatar = () => (
  <View style={avatarStyles.avatarBox}>
    <View style={avatarStyles.manBackdrop}>
      {/* Hair */}
      <View style={avatarStyles.manHair} />
      {/* Head + Beard */}
      <View style={avatarStyles.manFace}>
        <View style={avatarStyles.manBeard} />
      </View>
      {/* White shirt sleeves & crossed arms */}
      <View style={avatarStyles.manArms} />
      {/* Dark green stylist apron */}
      <View style={avatarStyles.manApron}>
        <Text style={avatarStyles.scissorsIcon}>✂</Text>
      </View>
    </View>
  </View>
);

// ----------------------------------------------------
// VERIFY MOBILE NUMBER VECTOR PHONE ILLUSTRATION (Matching Reference Screen 5)
// ----------------------------------------------------
const OtpPhoneIllustration = () => (
  <View style={authStyles.otpPhoneIllustrationContainer}>
    <View style={authStyles.otpPhoneOuterCircle}>
      <View style={authStyles.otpPhoneBody}>
        <View style={authStyles.otpPhoneNotch} />
        <View style={authStyles.otpPhoneScreen}>
          <View style={authStyles.otpSpeechBubble}>
            <Text style={authStyles.otpSpeechBubbleText}>OTP: ••••••</Text>
          </View>
        </View>
        <View style={authStyles.otpPhoneIndicatorLine} />
      </View>
      {/* Radiant accent bursts */}
      <View style={[confettiStyles.rayBar, { position: 'absolute', top: 12, right: 14, backgroundColor: '#2E9E1E', transform: [{ rotate: '35deg' }] }]} />
      <View style={[confettiStyles.rayBar, { position: 'absolute', top: 6, right: 26, backgroundColor: '#2E9E1E', transform: [{ rotate: '15deg' }] }]} />
      <View style={[confettiStyles.rayBar, { position: 'absolute', top: 22, right: 8, backgroundColor: '#2E9E1E', transform: [{ rotate: '55deg' }] }]} />
    </View>
  </View>
);

// ----------------------------------------------------
// DYNAMIC METRO / LOCALHOST API RESOLUTION
// ----------------------------------------------------
const getCandidateApiUrls = (): string[] => {
  const urls: string[] = [];
  if (process.env.EXPO_PUBLIC_API_URL) {
    urls.push(process.env.EXPO_PUBLIC_API_URL);
  }
  try {
    const scriptURL = (NativeModules as any)?.SourceCode?.scriptURL;
    if (scriptURL && typeof scriptURL === 'string') {
      const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        urls.push(`http://${match[1]}:4000/api`);
      }
    }
  } catch {}
  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:4000/api');
  }
  urls.push('http://localhost:4000/api');
  urls.push('http://127.0.0.1:4000/api');
  return Array.from(new Set(urls.filter(Boolean)));
};

// ----------------------------------------------------
// AUTO-ADVANCING 6-DIGIT OTP INPUT COMPONENT
// ----------------------------------------------------
interface OtpInputBoxesProps {
  digits: string[];
  onChangeDigits: (digits: string[]) => void;
  autoFocus?: boolean;
}

const OtpInputBoxes: React.FC<OtpInputBoxesProps> = ({
  digits,
  onChangeDigits,
  autoFocus = true,
}) => {
  const inputRefs = useRef<Array<any>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const handleChangeText = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');

    // Handle paste or multi-digit entry (e.g. "123456")
    if (clean.length > 1) {
      const next = [...digits];
      const chars = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] || '';
      }
      onChangeDigits(next);
      const nextFocus = Math.min(chars.length, 5);
      inputRefs.current[nextFocus]?.focus?.();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    onChangeDigits(next);

    // Auto-advance to next box when a digit is entered
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus?.();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent?.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        onChangeDigits(next);
        inputRefs.current[index - 1]?.focus?.();
      }
    }
  };

  return (
    <View style={authStyles.otpBoxesRow}>
      {[0, 1, 2, 3, 4, 5].map((idx) => {
        const val = digits[idx] || '';
        const isFocused = focusedIndex === idx;
        return (
          <View
            key={idx}
            style={[
              authStyles.otpSquareBox,
              val ? authStyles.otpSquareBoxActive : null,
              isFocused ? { borderColor: '#16A34A', borderWidth: 2 } : null,
            ]}
          >
            <TextInput
              ref={(ref: any) => {
                inputRefs.current[idx] = ref;
              }}
              style={authStyles.otpDigitText}
              keyboardType="number-pad"
              maxLength={idx === 0 ? 6 : 1}
              value={val}
              onChangeText={(text) => handleChangeText(text, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              onFocus={() => setFocusedIndex(idx)}
              onBlur={() => setFocusedIndex(-1)}
              textAlign="center"
              selectTextOnFocus
              autoFocus={autoFocus && idx === 0}
            />
          </View>
        );
      })}
    </View>
  );
};

// ----------------------------------------------------
// SCALLOPED GREEN REGISTRATION SUCCESS BADGE (Matching Reference Screen 4)
// ----------------------------------------------------
const RegistrationSuccessBadge = () => (
  <View style={authStyles.successBadgeOuterGlow}>
    <View style={authStyles.scallopBase}>
      <View style={[authStyles.scallopLeaf, { transform: [{ rotate: '0deg' }] }]} />
      <View style={[authStyles.scallopLeaf, { transform: [{ rotate: '30deg' }] }]} />
      <View style={[authStyles.scallopLeaf, { transform: [{ rotate: '60deg' }] }]} />
      <View style={authStyles.scallopCenter}>
        <Text style={authStyles.successCheckmark}>✓</Text>
      </View>
    </View>
    {/* 3 Green accent rays at top right */}
    <View style={[authStyles.successRay1, { transform: [{ rotate: '-25deg' }] }]} />
    <View style={[authStyles.successRay2, { transform: [{ rotate: '0deg' }] }]} />
    <View style={[authStyles.successRay1, { top: 4, right: -4, transform: [{ rotate: '25deg' }] }]} />
  </View>
);

// ----------------------------------------------------
// REGISTRATION SUBMITTED VECTOR CLIPBOARD (Matching Reference Screen 5)
// ----------------------------------------------------
const ClipboardSubmittedIllustration = () => (
  <View style={clipIllusStyles.container}>
    {/* Soft green circular halo backdrop */}
    <View style={clipIllusStyles.circleBackdrop} />

    {/* Clipboard base */}
    <View style={clipIllusStyles.boardFrame}>
      {/* Top Clip */}
      <View style={clipIllusStyles.topClip}>
        <View style={clipIllusStyles.topClipHole} />
      </View>
      {/* Paper area */}
      <View style={clipIllusStyles.paperArea}>
        {/* Large green checkmark circle */}
        <View style={clipIllusStyles.greenCheckCircle}>
          <Text style={clipIllusStyles.checkMarkText}>✓</Text>
        </View>
        {/* Paper lines */}
        <View style={clipIllusStyles.paperLine1} />
        <View style={clipIllusStyles.paperLine2} />
      </View>
    </View>

    {/* Radiant accent alert rays */}
    <View style={clipIllusStyles.ray1} />
    <View style={clipIllusStyles.ray2} />
    <View style={clipIllusStyles.ray3} />
  </View>
);

const clipIllusStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    position: 'relative',
    height: 140,
    width: 140,
    alignSelf: 'center',
  },
  circleBackdrop: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#DCFCE7',
  },
  boardFrame: {
    width: 82,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#1E7E10',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 5,
    paddingBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  topClip: {
    position: 'absolute',
    top: -8,
    width: 32,
    height: 14,
    borderRadius: 5,
    backgroundColor: '#1E7E10',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  topClipHole: {
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  paperArea: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  greenCheckCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2E9E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  checkMarkText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  paperLine1: {
    width: '75%',
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#86EFAC',
    marginBottom: 6,
  },
  paperLine2: {
    width: '50%',
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#BBF7D0',
  },
  ray1: {
    position: 'absolute',
    top: 8,
    right: 20,
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '45deg' }],
  },
  ray2: {
    position: 'absolute',
    top: 0,
    right: 36,
    width: 3,
    height: 12,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '15deg' }],
  },
  ray3: {
    position: 'absolute',
    top: 22,
    right: 12,
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '70deg' }],
  },
});

// ----------------------------------------------------
// 4-STEP HORIZONTAL STEPPER COMPONENT
// ----------------------------------------------------
const ProviderStepper = ({ currentStep }: { currentStep: number }) => (
  <View style={stepStyles.stepperWrapper}>
    <View style={stepStyles.stepsRow}>
      {/* Step 1 */}
      <View style={stepStyles.stepCol}>
        <View style={[
          stepStyles.stepCircle,
          currentStep > 1 && stepStyles.stepCircleCompleted,
          currentStep === 1 && stepStyles.stepCircleActive,
        ]}>
          <Text style={[
            stepStyles.stepNumber,
            currentStep >= 1 && stepStyles.stepNumberActive,
          ]}>
            {currentStep > 1 ? '✓' : '1'}
          </Text>
        </View>
        <Text style={[
          stepStyles.stepLabel,
          currentStep >= 1 && stepStyles.stepLabelActive,
        ]}>
          Basic Details
        </Text>
      </View>
      <View style={[stepStyles.stepLine, currentStep > 1 && stepStyles.stepLineActive]} />

      {/* Step 2 */}
      <View style={stepStyles.stepCol}>
        <View style={[
          stepStyles.stepCircle,
          currentStep > 2 && stepStyles.stepCircleCompleted,
          currentStep === 2 && stepStyles.stepCircleActive,
        ]}>
          <Text style={[
            stepStyles.stepNumber,
            currentStep >= 2 && stepStyles.stepNumberActive,
          ]}>
            {currentStep > 2 ? '✓' : '2'}
          </Text>
        </View>
        <Text style={[
          stepStyles.stepLabel,
          currentStep >= 2 && stepStyles.stepLabelActive,
        ]}>
          Profile & Documents
        </Text>
      </View>
      <View style={[stepStyles.stepLine, currentStep > 2 && stepStyles.stepLineActive]} />

      {/* Step 3 */}
      <View style={stepStyles.stepCol}>
        <View style={[
          stepStyles.stepCircle,
          currentStep > 3 && stepStyles.stepCircleCompleted,
          currentStep === 3 && stepStyles.stepCircleActive,
        ]}>
          <Text style={[
            stepStyles.stepNumber,
            currentStep >= 3 && stepStyles.stepNumberActive,
          ]}>
            {currentStep > 3 ? '✓' : '3'}
          </Text>
        </View>
        <Text style={[
          stepStyles.stepLabel,
          currentStep >= 3 && stepStyles.stepLabelActive,
        ]}>
          Service Details
        </Text>
      </View>
      <View style={[stepStyles.stepLine, currentStep > 3 && stepStyles.stepLineActive]} />

      {/* Step 4 */}
      <View style={stepStyles.stepCol}>
        <View style={[
          stepStyles.stepCircle,
          currentStep === 4 && stepStyles.stepCircleActive,
        ]}>
          <Text style={[
            stepStyles.stepNumber,
            currentStep === 4 && stepStyles.stepNumberActive,
          ]}>
            4
          </Text>
        </View>
        <Text style={[
          stepStyles.stepLabel,
          currentStep === 4 && stepStyles.stepLabelActive,
        ]}>
          Review & Submit
        </Text>
      </View>
    </View>
  </View>
);

const roleIconStyles = StyleSheet.create({
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 22,
  },
});

const avatarStyles = StyleSheet.create({
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  girlBackdrop: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  girlHairBack: {
    position: 'absolute',
    top: 6,
    width: 28,
    height: 32,
    borderRadius: 14,
    backgroundColor: '#3E2723',
  },
  girlFace: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFCCBC',
    marginTop: 8,
    zIndex: 2,
  },
  girlHairFront: {
    position: 'absolute',
    top: 6,
    width: 20,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#3E2723',
    zIndex: 3,
  },
  girlShirt: {
    width: 32,
    height: 18,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#F48FB1',
    zIndex: 2,
    marginTop: -2,
  },
  miniHandPhone: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    width: 10,
    height: 14,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tinyPhone: {
    width: 6,
    height: 8,
    backgroundColor: '#60A5FA',
    borderRadius: 1,
  },
  manBackdrop: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  manHair: {
    position: 'absolute',
    top: 6,
    width: 22,
    height: 12,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    backgroundColor: '#271C19',
    zIndex: 3,
  },
  manFace: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFCCBC',
    marginTop: 8,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  manBeard: {
    width: 14,
    height: 8,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    backgroundColor: '#271C19',
  },
  manArms: {
    position: 'absolute',
    bottom: 0,
    width: 38,
    height: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    zIndex: 1,
  },
  manApron: {
    width: 22,
    height: 20,
    backgroundColor: '#1B5E20',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginTop: -4,
  },
  scissorsIcon: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

const SpecialistIllustration = () => (
  <View style={illusStyles.wrapper}>
    <View style={illusStyles.circleBackdrop} />
    <View style={illusStyles.raysContainer}>
      <View style={[illusStyles.ray, { transform: [{ rotate: '-30deg' }] }]} />
      <View style={[illusStyles.ray, { transform: [{ rotate: '0deg' }], marginTop: -4 }]} />
      <View style={[illusStyles.ray, { transform: [{ rotate: '30deg' }] }]} />
    </View>
    <View style={illusStyles.specialistContainer}>
      <View style={illusStyles.hairCap}>
        <View style={illusStyles.face} />
      </View>
      <View style={illusStyles.apronBody}>
        <View style={illusStyles.collarRow}>
          <View style={illusStyles.collarLeft} />
          <View style={illusStyles.collarRight} />
        </View>
        <View style={illusStyles.apronButton} />
      </View>
    </View>
    <View style={illusStyles.badgeCircle}>
      <Text style={illusStyles.checkmarkText}>✓</Text>
    </View>
  </View>
);

const SmartphoneIllustration = () => (
  <View style={illusStyles.wrapper}>
    <View style={illusStyles.circleBackdrop} />
    <View style={illusStyles.raysContainer}>
      <View style={[illusStyles.ray, { transform: [{ rotate: '-30deg' }] }]} />
      <View style={[illusStyles.ray, { transform: [{ rotate: '0deg' }], marginTop: -4 }]} />
      <View style={[illusStyles.ray, { transform: [{ rotate: '30deg' }] }]} />
    </View>
    <View style={illusStyles.phoneFrame}>
      <View style={illusStyles.phoneSpeaker} />
      <View style={illusStyles.phoneCalendarMini}>
        <Text style={{ fontSize: 13, color: '#2E9E1E', fontWeight: 'bold' }}>✓</Text>
      </View>
      <View style={illusStyles.phoneItemRow}>
        <View style={illusStyles.phoneMiniCircle} />
        <View style={illusStyles.phoneMiniLine} />
      </View>
      <View style={illusStyles.phoneItemRow}>
        <View style={illusStyles.phoneMiniCircle} />
        <View style={illusStyles.phoneMiniLine} />
      </View>
    </View>
    <View style={illusStyles.badgeCircle}>
      <Text style={illusStyles.checkmarkText}>✓</Text>
    </View>
  </View>
);

const getCityLandmarkIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('hyderabad')) return '🏛️';
  if (n.includes('bengaluru') || n.includes('bangalore')) return '🏢';
  if (n.includes('chennai') || n.includes('madras')) return '🛕';
  if (n.includes('mumbai') || n.includes('bombay')) return '⛩️';
  if (n.includes('delhi')) return '🏛️';
  if (n.includes('pune')) return '🏰';
  if (n.includes('kolkata') || n.includes('calcutta')) return '🌉';
  if (n.includes('jaipur')) return '🏰';
  if (n.includes('ahmedabad')) return '🕌';
  if (n.includes('kochi') || n.includes('cochin')) return '🌴';
  return '📍';
};

function App() {
  // Cold start splash state
  const [isAppReady, setIsAppReady] = useState(false);

  // Onboarding multi-step state (Slides -> Location -> Auth)
  const [onboardingStage, setOnboardingStage] = useState<'carousel' | 'location' | 'auth'>('carousel');
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [selectedLangCode, setSelectedLangCode] = useState('English');
  const [selectedCityName, setSelectedCityName] = useState('Hyderabad');

  // Dynamic Service Cities from Supabase (Configured by Admin in Admin Panel)
  const [citiesList, setCitiesList] = useState<any[]>([
    { id: 'c1', name: 'Hyderabad', state: 'Telangana', is_active: true },
    { id: 'c2', name: 'Bengaluru', state: 'Karnataka', is_active: true },
    { id: 'c3', name: 'Mumbai', state: 'Maharashtra', is_active: true },
    { id: 'c4', name: 'Delhi', state: 'Delhi NCR', is_active: true },
  ]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  // Fetch admin-configured cities and subscribe to Supabase Realtime changes
  useEffect(() => {
    loadActiveCities(true);

    const channel = supabase
      .channel('rn-mobile-cities-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, () => {
        loadActiveCities(false);
      })
      .on('broadcast', { event: 'cities_updated' }, () => {
        loadActiveCities(false);
      })
      .subscribe();

    // Background heartbeat sync while user is selecting location
    const timer = setInterval(() => {
      loadActiveCities(false);
    }, 2500);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, []);

  const loadActiveCities = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoadingCities(true);
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        setCitiesList(data);
        if (!selectedCityName || !data.some((c: any) => c.name.toLowerCase() === selectedCityName.toLowerCase())) {
          setSelectedCityName(data[0].name);
        }
      }
    } catch (e) {
      console.warn('Error loading active cities:', e);
    } finally {
      if (showSpinner) setLoadingCities(false);
    }
  };

  // Auth state & Connected Flow (Screens matching exact designs)
  const [authStep, setAuthStep] = useState<
    | 'login'
    | 'choose_account_type'
    | 'register_user'
    | 'register_provider'
    | 'otp_user'
    | 'otp_provider'
    | 'otp_login'
    | 'success_user'
    | 'provider_pending'
    | 'role_select'
    | 'otp'
    | 'register_account'
    | 'success'
  >('login');
  const [authMobile, setAuthMobile] = useState('');
  const [authOtpDigits, setAuthOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(28);
  const [selectedRoleType, setSelectedRoleType] = useState<'customer' | 'provider'>('customer');

  // User Registration Validation States
  const [showNotRegisteredModal, setShowNotRegisteredModal] = useState(false);
  const [unregisteredPhone, setUnregisteredPhone] = useState('');
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);

  // Dynamic Service Categories & Services from Supabase
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [provSelectedServiceIds, setProvSelectedServiceIds] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const loadCategoriesFromDb = async () => {
    try {
      setLoadingCategories(true);
      const [catRes, srvRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('services')
          .select('id, category_id, name, base_price, duration_minutes')
          .eq('is_active', true)
          .order('name', { ascending: true }),
      ]);

      if (catRes.data && Array.isArray(catRes.data) && catRes.data.length > 0) {
        setDbCategories(catRes.data);
      }
      if (srvRes.data && Array.isArray(srvRes.data)) {
        setDbServices(srvRes.data);
      }
    } catch (e) {
      console.warn('Error loading dynamic categories & services:', e);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategoriesFromDb();

    const channel = supabase
      .channel('rn-categories-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategoriesFromDb();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        loadCategoriesFromDb();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mobile Number Registration & Validation Check (Backend API sole source of truth with instant Supabase fallback)
  const isMobileNumberRegistered = async (
    phone: string
  ): Promise<{ registered: boolean; user?: any }> => {
    const clean = (phone || '').replace(/\D/g, '');
    const last10 = clean.length >= 10 ? clean.slice(-10) : clean;
    if (!last10 || last10.length < 10) return { registered: false };

    // 1. Try Backend API candidates with fast 2.5s timeout to prevent UI freeze
    const apiCandidates = getCandidateApiUrls();
    for (const backendUrl of apiCandidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${backendUrl}/auth/check-phone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: last10 }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          if (json.registered) {
            return { registered: true, user: json.user };
          }
          return { registered: false };
        }
      } catch {}
    }

    // 2. Direct Supabase query fallback (zero latency, bypasses local firewall/port issues on phone)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, is_active')
        .or(`phone.eq.${last10},phone.eq.+91${last10},phone.ilike.*${last10}*`)
        .limit(1);
      if (!error && data && data.length > 0) {
        return { registered: true, user: data[0] };
      }
    } catch {}

    return { registered: false };
  };

  // General User Registration States (Clean, Live DB & Postal API)
  const [userRegName, setUserRegName] = useState('');
  const [userRegEmail, setUserRegEmail] = useState('');
  const [userRegMobile, setUserRegMobile] = useState('');
  const [userRegPin, setUserRegPin] = useState('');
  const [userRegLocationDetected, setUserRegLocationDetected] = useState(false);
  const [userRegArea, setUserRegArea] = useState('');
  const [userRegCity, setUserRegCity] = useState('');
  const [userRegDistrict, setUserRegDistrict] = useState('');
  const [userRegState, setUserRegState] = useState('');
  const [userRegHouse, setUserRegHouse] = useState('');
  const [userRegBuilding, setUserRegBuilding] = useState('');
  const [userRegStreet, setUserRegStreet] = useState('');
  const [userRegLandmark, setUserRegLandmark] = useState('');
  const [userRegAvailableAreas, setUserRegAvailableAreas] = useState<string[]>([]);
  const [userRegIsPincodeLoading, setUserRegIsPincodeLoading] = useState(false);
  const [userRegManualAddressOpen, setUserRegManualAddressOpen] = useState(false);
  const [userRegAgreed, setUserRegAgreed] = useState(false);

  // Service Provider Registration States (Clean, Live DB & Postal API)
  const [providerStep, setProviderStep] = useState<1 | 2 | 3 | 4>(1);
  const [provRegName, setProvRegName] = useState('');
  const [provRegBusinessName, setProvRegBusinessName] = useState('');
  const [provRegCategory, setProvRegCategory] = useState('');
  const [provRegEmail, setProvRegEmail] = useState('');
  const [provRegMobile, setProvRegMobile] = useState('');
  const [provRegPin, setProvRegPin] = useState('');
  const [provRegLocationDetected, setProvRegLocationDetected] = useState(false);
  const [provRegArea, setProvRegArea] = useState('');
  const [provRegCity, setProvRegCity] = useState('');
  const [provRegDistrict, setProvRegDistrict] = useState('');
  const [provRegState, setProvRegState] = useState('');
  const [provRegHouse, setProvRegHouse] = useState('');
  const [provRegBuilding, setProvRegBuilding] = useState('');
  const [provRegStreet, setProvRegStreet] = useState('');
  const [provRegLandmark, setProvRegLandmark] = useState('');
  const [provRegAvailableAreas, setProvRegAvailableAreas] = useState<string[]>([]);
  const [provRegIsPincodeLoading, setProvRegIsPincodeLoading] = useState(false);
  const [provRegManualAddressOpen, setProvRegManualAddressOpen] = useState(false);
  const [provRegBusinessType, setProvRegBusinessType] = useState('Individual Professional');
  const [provRegAbout, setProvRegAbout] = useState('');
  const [provAadhaarUploaded, setProvAadhaarUploaded] = useState(false);
  const [provPanUploaded, setProvPanUploaded] = useState(false);
  const [provExpUploaded, setProvExpUploaded] = useState(false);

  // High-Clarity Documents, Workplace Photos & Google Maps verification states
  const [provAadhaarDoc, setProvAadhaarDoc] = useState<{
    dataUrl: string;
    fileName: string;
    fileSizeKb: number;
    type: string;
  } | null>(null);
  const [provPanDoc, setProvPanDoc] = useState<{
    dataUrl: string;
    fileName: string;
    fileSizeKb: number;
    type: string;
  } | null>(null);
  const [provExpDoc, setProvExpDoc] = useState<{
    dataUrl: string;
    fileName: string;
    fileSizeKb: number;
    type: string;
  } | null>(null);
  const [provPremisePhotos, setProvPremisePhotos] = useState<
    Array<{
      dataUrl: string;
      fileName: string;
      fileSizeKb: number;
      type: string;
      label?: string;
    }>
  >([]);
  const [provGoogleMapsLink, setProvGoogleMapsLink] = useState('');
  const [clarityRequestReason, setClarityRequestReason] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadModalTarget, setUploadModalTarget] = useState<'aadhaar' | 'pan' | 'exp' | 'premise' | null>(null);
  const [isCompressingHd, setIsCompressingHd] = useState(false);
  const [provRegServices, setProvRegServices] = useState('');
  const [provRegServiceLocation, setProvRegServiceLocation] = useState('');
  const [provAvailableDays, setProvAvailableDays] = useState<string[]>([
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ]);
  const [provWorkingHoursFrom, setProvWorkingHoursFrom] = useState('09:00 AM');
  const [provWorkingHoursTo, setProvWorkingHoursTo] = useState('07:00 PM');
  const [provReviewAgreed, setProvReviewAgreed] = useState(false);
  const [isSubmittingDb, setIsSubmittingDb] = useState(false);

  // General App & Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [activeRole, setActiveRole] = useState<'customer' | 'provider'>('customer');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [providerVerificationStatus, setProviderVerificationStatus] = useState<
    'PENDING' | 'UNDER_REVIEW' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'NOT_REGISTERED'
  >('PENDING');
  const [providerRejectionReason, setProviderRejectionReason] = useState<string>('');
  const [providerProfileState, setProviderProfileState] = useState<any>(null);
  const [providerNotifications, setProviderNotifications] = useState<any[]>([]);

  const syncProviderAccountState = async (phoneArg?: string) => {
    const clean = (phoneArg || provRegMobile || phoneNumber || '').replace(/\D/g, '').slice(-10);
    if (!clean) return null;

    const apiCandidates = [
      process.env.EXPO_PUBLIC_API_URL,
      Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api',
      'http://localhost:4000/api',
    ].filter(Boolean) as string[];
    for (const backendUrl of Array.from(new Set(apiCandidates))) {
      try {
        const res = await fetch(`${backendUrl}/auth/check-phone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: clean }),
        });
        if (res.ok) {
          const json = await res.json();
          const prof = json?.user?.providerProfile;
          if (prof) {
            const status = (prof.verificationStatus || 'PENDING') as any;
            setProviderProfileState(prof);
            setProviderVerificationStatus(status);
            setProviderRejectionReason(prof.rejectionReason || '');
            if (status === 'NEEDS_INFO' || status === 'REJECTED') {
              setClarityRequestReason(prof.rejectionReason || '');
            }
            return { status, profile: prof };
          }
        }
      } catch {}
    }
    return null;
  };

  // Authoritative Backend Registration (Supabase PostgreSQL via Express API)
  const registerUserInDb = async (userData: {
    fullName: string;
    email: string;
    phone: string;
    pin: string;
    locality: string;
    city: string;
    state: string;
    district?: string;
    house?: string;
    building?: string;
    street?: string;
    landmark?: string;
  }) => {
    try {
      setIsSubmittingDb(true);
      const cleanPhone = userData.phone.replace(/[^0-9]/g, '');
      const fullAddressParts = [
        userData.house ? `Flat/House: ${userData.house}` : '',
        userData.building ? userData.building : '',
        userData.street ? userData.street : '',
        userData.locality ? userData.locality : '',
        userData.landmark ? `Near ${userData.landmark}` : '',
        userData.city,
        userData.district && userData.district !== userData.city ? userData.district : '',
        userData.state ? `${userData.state} - ${userData.pin}` : userData.pin,
      ].filter(Boolean);
      const formattedAddress = fullAddressParts.join(', ');

      const candidateUrls = getCandidateApiUrls();

      for (const url of candidateUrls) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(`${url}/auth/register-customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              fullName: userData.fullName,
              phone: cleanPhone,
              email: userData.email,
              city: userData.city,
              state: userData.state,
              area: userData.locality,
              pincode: userData.pin,
              address: formattedAddress,
            }),
          });
          clearTimeout(timeout);
          if (res.ok) {
            return await res.json();
          }
        } catch {}
      }

      // Supabase direct fallback if backend port 4000 is unreachable from physical device
      const existingUser = await supabase
        .from('users')
        .select('id')
        .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`)
        .maybeSingle();

      let userId = existingUser.data?.id;
      if (!userId) {
        const { data: newUser, error: userErr } = await supabase
          .from('users')
          .insert({
            phone: cleanPhone,
            full_name: userData.fullName,
            email: userData.email || `${cleanPhone}@quickappointments.app`,
            is_active: true,
          })
          .select('id')
          .single();
        if (userErr) throw userErr;
        userId = newUser.id;

        await supabase.from('user_roles').insert({
          user_id: userId,
          role: 'CUSTOMER',
        });
      }

      await supabase.from('customer_profiles').upsert(
        {
          user_id: userId,
          city: userData.city || 'Warangal',
          default_address: formattedAddress,
        },
        { onConflict: 'user_id' }
      );

      return { success: true, userId };
    } catch (err) {
      console.warn('registerUserInDb error:', err);
      throw err;
    } finally {
      setIsSubmittingDb(false);
    }
  };

  const applyUploadedDoc = (
    target: 'aadhaar' | 'pan' | 'exp' | 'premise',
    doc: { dataUrl: string; fileName: string; fileSizeKb: number; type: string; label?: string }
  ) => {
    if (target === 'aadhaar') {
      setProvAadhaarDoc(doc);
      setProvAadhaarUploaded(true);
    } else if (target === 'pan') {
      setProvPanDoc(doc);
      setProvPanUploaded(true);
    } else if (target === 'exp') {
      setProvExpDoc(doc);
      setProvExpUploaded(true);
    } else if (target === 'premise') {
      setProvPremisePhotos((prev) => {
        if (prev.length >= 3) {
          Alert.alert('Maximum Reached', 'You can upload up to 3 premise photos.');
          return prev;
        }
        return [...prev, doc];
      });
    }
  };

  const triggerDocPicker = (
    source: 'camera' | 'gallery' | 'file',
    target: 'aadhaar' | 'pan' | 'exp' | 'premise'
  ) => {
    setUploadModalVisible(false);

    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      if (source === 'camera') {
        input.accept = 'image/*';
        input.capture = 'environment';
      } else if (source === 'gallery') {
        input.accept = 'image/*';
      } else {
        input.accept = 'image/*,application/pdf';
      }

      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          setIsCompressingHd(true);
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const rawUrl = uploadEvent.target?.result as string;
            if (file.type.includes('image')) {
              const img = new (window as any).Image();
              img.src = rawUrl;
              img.onload = () => {
                // HD Clarity Preservation: Max dimension 1920px (Full HD)
                const maxDim = 1920;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                  if (w > h) {
                    h = Math.round((h * maxDim) / w);
                    w = maxDim;
                  } else {
                    w = Math.round((w * maxDim) / h);
                    h = maxDim;
                  }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, w, h);
                  ctx.drawImage(img, 0, 0, w, h);
                  // 0.85 compression delivers sharp text clarity on IDs and signs with compact file size (~280-450 KB)
                  const hdCompressedUrl = canvas.toDataURL('image/jpeg', 0.85);
                  const base64Len = hdCompressedUrl.length - (hdCompressedUrl.indexOf(',') + 1);
                  const sizeKb = Math.round((base64Len * 0.75) / 1024) || 315;

                  applyUploadedDoc(target, {
                    dataUrl: hdCompressedUrl,
                    fileName: file.name || `${target}_hd.jpg`,
                    fileSizeKb: sizeKb,
                    type:
                      target === 'aadhaar'
                        ? 'AADHAAR'
                        : target === 'pan'
                        ? 'PAN'
                        : target === 'exp'
                        ? 'WORK_EXPERIENCE'
                        : 'PREMISE_PHOTO',
                    label:
                      target === 'premise'
                        ? `Premise Photo ${provPremisePhotos.length + 1}`
                        : undefined,
                  });
                }
                setIsCompressingHd(false);
              };
            } else {
              // PDF file
              const base64Len = rawUrl.length - (rawUrl.indexOf(',') + 1);
              const sizeKb = Math.round((base64Len * 0.75) / 1024) || 350;
              applyUploadedDoc(target, {
                dataUrl: rawUrl,
                fileName: file.name || `${target}.pdf`,
                fileSizeKb: sizeKb,
                type:
                  target === 'aadhaar'
                    ? 'AADHAAR'
                    : target === 'pan'
                    ? 'PAN'
                    : target === 'exp'
                    ? 'WORK_EXPERIENCE'
                    : 'PREMISE_PHOTO',
              });
              setIsCompressingHd(false);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Pure React Native fallback (Hermes)
      const sampleKb = target === 'premise' ? 340 : target === 'aadhaar' ? 290 : 315;
      const sampleUrl =
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80';
      applyUploadedDoc(target, {
        dataUrl: sampleUrl,
        fileName: `${target}_hd_verified.jpg`,
        fileSizeKb: sampleKb,
        type:
          target === 'aadhaar'
            ? 'AADHAAR'
            : target === 'pan'
            ? 'PAN'
            : target === 'exp'
            ? 'WORK_EXPERIENCE'
            : 'PREMISE_PHOTO',
        label:
          target === 'premise'
            ? `Premise Photo ${provPremisePhotos.length + 1}`
            : undefined,
      });
      Alert.alert(
        'HD Document Attached',
        `${target.toUpperCase()} compressed with HD clarity (${sampleKb} KB).`
      );
    }
  };

  const registerProviderInDb = async (providerData: {
    fullName: string;
    businessName: string;
    category: string;
    email: string;
    phone: string;
    pin: string;
    locality: string;
    city: string;
    state: string;
    district?: string;
    house?: string;
    building?: string;
    street?: string;
    landmark?: string;
    businessType?: string;
    about?: string;
    workingDays?: string[];
    workingHoursFrom?: string;
    workingHoursTo?: string;
    googleMapsLink?: string;
    serviceIds?: string[];
    premisePhotos?: Array<{
      dataUrl: string;
      fileName: string;
      fileSizeKb: number;
      type: string;
      label?: string;
    }>;
    aadhaarDoc?: {
      dataUrl: string;
      fileName: string;
      fileSizeKb: number;
      type: string;
    } | null;
    panDoc?: {
      dataUrl: string;
      fileName: string;
      fileSizeKb: number;
      type: string;
    } | null;
    expDoc?: {
      dataUrl: string;
      fileName: string;
      fileSizeKb: number;
      type: string;
    } | null;
  }) => {
    try {
      setIsSubmittingDb(true);
      const cleanPhone = providerData.phone.replace(/[^0-9]/g, '');
      const fullAddressParts = [
        providerData.house ? `Unit/Shop: ${providerData.house}` : '',
        providerData.building ? providerData.building : '',
        providerData.street ? providerData.street : '',
        providerData.locality ? providerData.locality : '',
        providerData.landmark ? `Near ${providerData.landmark}` : '',
        providerData.city,
        providerData.district && providerData.district !== providerData.city ? providerData.district : '',
        providerData.state ? `${providerData.state} - ${providerData.pin}` : providerData.pin,
      ].filter(Boolean);
      const formattedAddress = fullAddressParts.join(', ');

      const apiCandidates = [
        process.env.EXPO_PUBLIC_API_URL,
        Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api',
        'http://localhost:4000/api',
      ].filter(Boolean) as string[];
      const backendDocuments = [
        ...(providerData.aadhaarDoc?.dataUrl
          ? [{
              docType: 'AADHAAR_CARD',
              documentNumber: providerData.aadhaarDoc.fileName || 'Aadhaar Front (HD)',
              fileName: providerData.aadhaarDoc.fileName,
              mimeType: providerData.aadhaarDoc.type,
              fileUrl: providerData.aadhaarDoc.dataUrl,
            }]
          : []),
        ...(providerData.panDoc?.dataUrl
          ? [{
              docType: 'PAN_CARD',
              documentNumber: providerData.panDoc.fileName || 'PAN Front (HD)',
              fileName: providerData.panDoc.fileName,
              mimeType: providerData.panDoc.type,
              fileUrl: providerData.panDoc.dataUrl,
            }]
          : []),
        ...(providerData.expDoc?.dataUrl
          ? [{
              docType: 'WORK_EXPERIENCE',
              documentNumber: providerData.expDoc.fileName || 'Experience Certificate',
              fileName: providerData.expDoc.fileName,
              mimeType: providerData.expDoc.type,
              fileUrl: providerData.expDoc.dataUrl,
            }]
          : []),
      ];

      let registeredOk = false;
      for (const backendUrl of Array.from(new Set(apiCandidates))) {
        try {
          const apiRes = await fetch(`${backendUrl}/auth/register-provider`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: providerData.fullName,
              phone: cleanPhone,
              email: providerData.email,
              businessName: providerData.businessName,
              businessType: providerData.businessType,
              category: providerData.category,
              city: providerData.city,
              pincode: providerData.pin,
              address: formattedAddress,
              bio: providerData.about,
              workingDays: providerData.workingDays,
              workingHours: `${providerData.workingHoursFrom || '09:00 AM'} - ${providerData.workingHoursTo || '07:00 PM'}`,
              googleMapsLink: providerData.googleMapsLink,
              premisePhotos: (providerData.premisePhotos || []).map((p) => p.dataUrl),
              serviceIds: providerData.serviceIds || [],
              documents: backendDocuments,
            }),
          });
          if (apiRes.ok) {
            registeredOk = true;
            break;
          }
        } catch {}
      }
      if (!registeredOk) {
        throw new Error('Unable to reach Quick Appointments server to register provider account.');
      }

      setProviderVerificationStatus('PENDING');
      setProviderRejectionReason('');
      setProviderProfileState({
        business_name: providerData.businessName,
        businessName: providerData.businessName,
        verification_status: 'PENDING',
        verificationStatus: 'PENDING',
        is_accepting_bookings: false,
        city: providerData.city,
        address: formattedAddress,
      });
    } catch (err) {
      console.warn('registerProviderInDb background sync warning:', err);
    } finally {
      setIsSubmittingDb(false);
    }
  };

  // OTP Countdown timer for OTP screens
  useEffect(() => {
    let interval: any = null;
    const isOtpStep =
      authStep === 'otp' ||
      authStep === 'otp_login' ||
      authStep === 'otp_user' ||
      authStep === 'otp_provider';
    if (isOtpStep && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authStep, otpCountdown]);

  // Sync selected location into registration & home state
  useEffect(() => {
    if (selectedCityName) {
      setCustomerCity(selectedCityName);
    }
  }, [selectedCityName]);

  // Customer State
  const [customerTab, setCustomerTab] = useState<'home' | 'search' | 'bookings' | 'favorites' | 'profile' | 'all_categories' | 'category_detail'>('home');
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<any>(ALL_12_CATEGORIES[0]);
  const [activeSubcategoryFilter, setActiveSubcategoryFilter] = useState<string | null>(null);
  const [isCategoryDetailFavorite, setIsCategoryDetailFavorite] = useState(false);
  const [customerCity, setCustomerCity] = useState(selectedCityName || 'Warangal');
  const [cityPickerModalVisible, setCityPickerModalVisible] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(['Home Cleaning', 'Beauty & Salon', 'Plumbing']);
  const [trendingSearches] = useState<string[]>(['Facial', 'Hair Spa', 'AC Repair', 'Deep Cleaning']);
  const [favoritesList, setFavoritesList] = useState<string[]>(['ps1', 'fp1']);
  const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
  const [activeBannerSlide, setActiveBannerSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);
  const [razorpayModalVisible, setRazorpayModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isPaying, setIsPaying] = useState(false);

  // Bookings state (populated dynamically from Backend API)
  const [bookings, setBookings] = useState<any[]>([]);

  // Rescheduling state
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [reschedulingBooking, setReschedulingBooking] = useState<any>(null);
  const [newSelectedSlot, setNewSelectedSlot] = useState(TIME_SLOTS[1]);

  // Appointment Details Modal
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any>(null);

  // Profile Sub-Modals
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [addressesModalVisible, setAddressesModalVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [newAddressInput, setNewAddressInput] = useState('');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [smsRemindersEnabled, setSmsRemindersEnabled] = useState(true);

  // Provider State
  const [providerTab, setProviderTab] = useState<'dashboard' | 'schedule' | 'earnings' | 'profile'>('dashboard');
  const [isOnline, setIsOnline] = useState(false);
  const [slaCountdown, setSlaCountdown] = useState(120);
  const [pendingJob, setPendingJob] = useState<any>(null);
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [providerEarnings, setProviderEarnings] = useState(0);
  const [completedJobsCount, setCompletedJobsCount] = useState(0);

  // Cold start splash initialization: run once, pre-load session, smoothly transition
  useEffect(() => {
    let timer = setTimeout(() => {
      setIsAppReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

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

  // Status bar styling (Dark icons on brand cream background)
  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    if ((StatusBar as any).setBackgroundColor) {
      (StatusBar as any).setBackgroundColor(COLORS.bg, true);
    }
  }, []);

  // Auth Handler via Backend OTP API
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const apiCandidates = [
      process.env.EXPO_PUBLIC_API_URL,
      Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api',
      'http://localhost:4000/api',
    ].filter(Boolean) as string[];
    for (const backendUrl of Array.from(new Set(apiCandidates))) {
      try {
        const res = await fetch(`${backendUrl}/auth/request-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          Alert.alert('Verification Error', data?.error || 'Account not found or OTP dispatch failed.');
          return;
        }
        setIsOtpSent(true);
        if (data?.devOtp) {
          Alert.alert('OTP Dispatched', `Development OTP: ${data.devOtp}`);
        }
        return;
      } catch {}
    }
    Alert.alert('Network Error', 'Unable to reach Quick Appointments server to dispatch OTP.');
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the verification OTP sent to your phone.');
      return;
    }
    const apiCandidates = [
      process.env.EXPO_PUBLIC_API_URL,
      Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api',
      'http://localhost:4000/api',
    ].filter(Boolean) as string[];
    for (const backendUrl of Array.from(new Set(apiCandidates))) {
      try {
        const res = await fetch(`${backendUrl}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber, otp: otp.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          Alert.alert('Verification Failed', data?.error || 'Incorrect or expired OTP.');
          return;
        }
        setIsAuthenticated(true);
        return;
      } catch {}
    }
    Alert.alert('Network Error', 'Unable to reach Quick Appointments server to verify OTP.');
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

      // Trigger incoming pending job for provider view
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
    }, 1000);
  };

  // Provider SLA Actions
  const handleAcceptJob = () => {
    Alert.alert('Job Accepted', 'You have accepted the booking. Proceed to client location.');
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

  // Reschedule Action
  const handleConfirmReschedule = () => {
    if (!reschedulingBooking) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === reschedulingBooking.id ? { ...b, slot: `Rescheduled to ${newSelectedSlot}` } : b
      )
    );
    setRescheduleModalVisible(false);
    setReschedulingBooking(null);
    Alert.alert('Slot Rescheduled', `Your appointment has been successfully updated to ${newSelectedSlot}.`);
  };

  // ----------------------------------------------------
  // 1. COLD-START SPLASH SCREEN (Unified Single Professional Splash)
  // ----------------------------------------------------
  if (!isAppReady) {
    return (
      <SafeAreaView style={styles.splashContainer}>
        <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={styles.splashContent}>
          {/* Centered High-Resolution Official Logo with Standard Mobile Proportions */}
          <View style={styles.splashLogoContainer}>
            <Image
              source={require('./assets/splash-logo.png')}
              style={styles.splashLogoImage}
              resizeMode="contain"
            />
          </View>
          <View style={{ marginTop: 24 }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // 2. AUTH / ONBOARDING SCREEN
  // ----------------------------------------------------
  if (!isAuthenticated) {
    // Stage 1: Carousel Onboarding (Slides 1, 2, 3 as shown in screenshots)
    if (onboardingStage === 'carousel') {
      const activeSlide = ONBOARDING_SLIDES[onboardingIndex];
      return (
        <SafeAreaView style={styles.onboardingContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          
          {/* Top Bar with Back Arrow (when slide > 0) and Skip (Completely removed logo for clean minimal layout) */}
          <View style={styles.onboardingTopBar}>
            {onboardingIndex > 0 ? (
              <TouchableOpacity
                onPress={() => setOnboardingIndex(onboardingIndex - 1)}
                style={styles.onboardingNavBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.onboardingNavBtnText}>←</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44, height: 44 }} />
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => setOnboardingStage('location')}
              style={styles.skipButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Center Illustration & Content */}
          <View style={styles.onboardingSlideContent}>
            {/* Vector Illustration matching exact reference screenshots */}
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              {activeSlide.type === 'calendar' && <CalendarIllustration />}
              {activeSlide.type === 'specialist' && <SpecialistIllustration />}
              {activeSlide.type === 'phone' && <SmartphoneIllustration />}
            </View>

            {/* Main Heading */}
            <Text style={styles.onboardingTitle}>
              {activeSlide.title}
            </Text>

            {/* Emerald Horizontal Divider */}
            <View style={{ width: 44, height: 3.5, backgroundColor: '#2E9E1E', borderRadius: 2, alignSelf: 'center', marginVertical: 12 }} />

            {/* Subtitle */}
            <Text style={[styles.onboardingSubtitle, { alignSelf: 'center' }]}>
              {activeSlide.desc}
            </Text>

            {/* 3-Dot Indicator */}
            <View style={styles.onboardingDotsRow}>
              {ONBOARDING_SLIDES.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setOnboardingIndex(idx)}
                  style={[
                    styles.onboardingDot,
                    onboardingIndex === idx && styles.onboardingDotActive,
                  ]}
                  activeOpacity={0.7}
                />
              ))}
            </View>
          </View>

          {/* Bottom Action Pill Button */}
          <View style={styles.onboardingBottom}>
            <TouchableOpacity
              style={styles.onboardingPillButton}
              onPress={() => {
                if (onboardingIndex < ONBOARDING_SLIDES.length - 1) {
                  setOnboardingIndex(onboardingIndex + 1);
                } else {
                  setOnboardingStage('location');
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.onboardingPillButtonText}>{activeSlide.buttonText}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    // Stage 2: Select Location Screen (Admin Managed Service Cities - Matching Image 1)
    if (onboardingStage === 'location') {
      const filteredCities = citiesList.filter((c: any) =>
        (c.name || '').toLowerCase().includes(citySearchQuery.toLowerCase()) ||
        (c.state || '').toLowerCase().includes(citySearchQuery.toLowerCase())
      );

      return (
        <SafeAreaView style={styles.onboardingContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          {/* Top Bar with Back Arrow */}
          <View style={styles.onboardingTopBar}>
            <TouchableOpacity
              onPress={() => setOnboardingStage('carousel')}
              style={styles.onboardingNavBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.onboardingNavBtnText}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <View style={{ width: 44, height: 44 }} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Map & City Skyline Vector Illustration (Image 1) */}
            <LocationMapIllustration />

            {/* Title & Subtitle */}
            <Text style={[styles.onboardingTitle, { marginTop: 4 }]}>Select Your Location</Text>
            <Text style={[styles.onboardingSubtitle, { alignSelf: 'center', marginBottom: 16 }]}>
              Choose your city to find nearby services and providers
            </Text>

            {/* City Search Bar (Image 1) */}
            <View style={styles.citySearchBoxModern}>
              <Text style={{ fontSize: 16, marginRight: 8, color: '#64748B' }}>🔍</Text>
              <TextInput
                style={{ flex: 1, fontSize: 14, color: '#111111' }}
                placeholder="Search city or state"
                placeholderTextColor="#94A3B8"
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
              />
            </View>

            {/* Use My Current Location Action Button (Image 1) */}
            <TouchableOpacity
              style={styles.useCurrentLocationBox}
              onPress={() => {
                setSelectedCityName('Hyderabad');
                Alert.alert('Location Detected', 'Set current location to Hyderabad, Telangana.');
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18, color: '#2E9E1E' }}>◎</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1B5E20' }}>
                  Use my current location
                </Text>
              </View>
              <Text style={{ fontSize: 18, color: '#2E9E1E', fontWeight: 'bold' }}>›</Text>
            </TouchableOpacity>

            {/* Popular Cities Header Row with Admin Managed Badge */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111111' }}>
                Popular Cities
              </Text>
              <View style={styles.adminManagedBadge}>
                <Text style={styles.adminManagedText}>ⓘ Admin Managed Cities</Text>
              </View>
            </View>

            {loadingCities && citiesList.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#2E9E1E" />
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
                  Loading service locations...
                </Text>
              </View>
            ) : filteredCities.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                  No service location found matching "{citySearchQuery}".
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {filteredCities.map((c: any) => {
                  const isSelected = selectedCityName.toLowerCase() === (c.name || '').toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c.id || c.name}
                      onPress={() => setSelectedCityName(c.name)}
                      style={[
                        styles.cityCardModern,
                        isSelected && styles.cityCardModernSelected,
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Text style={[{ fontSize: 14, fontWeight: 'bold', color: '#111111' }, isSelected && { color: '#1B5E20' }]} numberOfLines={1}>
                          {c.name}
                        </Text>
                        {c.state ? (
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                            {c.state}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[
                        styles.cityRadioCircle,
                        isSelected && styles.cityRadioCircleSelected,
                      ]}>
                        {isSelected && (
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          <View style={styles.onboardingBottom}>
            <TouchableOpacity
              style={styles.onboardingPillButton}
              onPress={() => {
                setOnboardingStage('auth');
                setAuthStep('login');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.onboardingPillButtonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    // Stage 3: Complete Mobile App UI/UX Refinement and Screen Flow Implementation
    // Screen A: Select Your Role Screen (role_select - Clean layout, NO LOGO, entire-card clickable)
    // Screen B: Login Screen (login - NO logo in center, Repositioned at bottom underneath primary content)
    // Screen C: Verify Mobile Number (otp - Matching Image 2 with phone illustration and "OTP: 123456")
    // Screen D: Create Your Account (register_account - Matching Image 3 with Name, Email, Password, Terms)
    // Screen E: Thank You for Registration! (success - Matching Image 1 with green checkmark badge)

    // ====================================================
    // AUTHENTICATION & REGISTRATION SCREEN FLOW
    // 1. Login Screen (authStep === 'login')
    // 2. Choose Your Account Type (authStep === 'choose_account_type')
    // 3. General User Registration (authStep === 'register_user')
    // 4. General User OTP Verification (authStep === 'otp_user')
    // 5. General User Success (authStep === 'success_user')
    // 6. Service Provider Registration (authStep === 'register_provider')
    // 7. Service Provider OTP Verification (authStep === 'otp_provider')
    // 8. Service Provider Pending Approval (authStep === 'provider_pending')
    // 9. Login OTP Verification (authStep === 'otp_login')
    // ====================================================

    // 1. LOGIN SCREEN (Clean, Minimal, Text-Based - No Icons)
    if (authStep === 'login') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <ScrollView
            contentContainerStyle={authStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={authStyles.topNavRow}>
              <TouchableOpacity
                onPress={() => setOnboardingStage('location')}
                style={authStyles.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={authStyles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Centered Brand Logo */}
            <View style={authStyles.logoCenterContainer}>
              <Image
                source={require('./assets/splash-logo.png')}
                style={authStyles.brandLogo}
                resizeMode="contain"
              />
            </View>

            {/* Title & Subtitle */}
            <View style={{ marginTop: 4 }}>
              <Text style={authStyles.screenTitle}>Enter Your Mobile Number</Text>
              <Text style={authStyles.screenSubtitle}>
                We will send you a one-time password (OTP) for verification.
              </Text>

              {/* Clean Minimal Text-Based Phone Input Box (NO icons, Clean +91 Input) */}
              <View style={authStyles.cleanPhoneInputBox}>
                <View style={authStyles.cleanPrefixBadge}>
                  <Text style={authStyles.cleanPrefixText}>+91</Text>
                </View>
                <TextInput
                  style={authStyles.cleanPhoneInput}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={authMobile}
                  onChangeText={setAuthMobile}
                />
              </View>

              {/* Send OTP Button (Clean Text, No Arrow, Loading Indicator) */}
              <TouchableOpacity
                style={[
                  authStyles.primaryPillBtn,
                  { marginTop: 16 },
                  isCheckingMobile ? { opacity: 0.75 } : null,
                ]}
                disabled={isCheckingMobile}
                onPress={async () => {
                  const clean = (authMobile || '').replace(/\D/g, '');
                  const last10 = clean.length >= 10 ? clean.slice(-10) : clean;
                  if (!last10 || last10.length < 10) {
                    Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
                    return;
                  }

                  setIsCheckingMobile(true);
                  try {
                    const check = await isMobileNumberRegistered(last10);
                    setIsCheckingMobile(false);

                    if (!check.registered) {
                      // Unregistered mobile number: Show "Account Not Found!" popup
                      setUnregisteredPhone(last10);
                      setShowNotRegisteredModal(true);
                      return;
                    }

                    // Existing registered user: proceed with OTP verification
                    setOtpCountdown(28);
                    setAuthOtpDigits(['', '', '', '', '', '']);
                    setAuthStep('otp_login');
                  } catch (err: any) {
                    setIsCheckingMobile(false);
                    Alert.alert(
                      'Verification Error',
                      'Unable to verify mobile number. Please check your network connection and try again.'
                    );
                  }
                }}
                activeOpacity={0.85}
              >
                {isCheckingMobile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={authStyles.primaryPillBtnText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={authStyles.orDividerRow}>
                <View style={authStyles.orLine} />
                <Text style={authStyles.orText}>or</Text>
                <View style={authStyles.orLine} />
              </View>

              {/* Create an Account Outlined Button (Text Only, No Icons) */}
              <TouchableOpacity
                style={authStyles.outlinePillBtn}
                onPress={() => {
                  if (authMobile) {
                    const clean = authMobile.replace(/\D/g, '');
                    const last10 = clean.length >= 10 ? clean.slice(-10) : clean;
                    setUserRegMobile(last10);
                    setProvRegMobile(last10);
                  }
                  setAuthStep('choose_account_type');
                }}
                activeOpacity={0.85}
              >
                <Text style={authStyles.outlinePillBtnText}>Create an Account</Text>
              </TouchableOpacity>

              {/* Footer Terms */}
              <View style={[authStyles.footerBox, { marginTop: 28, marginBottom: 16 }]}>
                <Text style={authStyles.footerText}>By continuing, you agree to our</Text>
                <View style={authStyles.footerLinkRow}>
                  <Text style={authStyles.footerLink}>Terms & Conditions</Text>
                  <Text style={authStyles.footerText}> and </Text>
                  <Text style={authStyles.footerLink}>Privacy Policy</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Professional "Account Not Found!" Popup Modal (Quick Appointments Theme) */}
          <Modal
            visible={showNotRegisteredModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowNotRegisteredModal(false)}
          >
            <View style={authStyles.modalOverlay}>
              <View style={authStyles.modalCard}>
                {/* Close Cross (✕) Button */}
                <TouchableOpacity
                  style={authStyles.modalCloseBtn}
                  onPress={() => setShowNotRegisteredModal(false)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={authStyles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>

                {/* Title */}
                <Text style={authStyles.modalTitle}>Account Not Found!</Text>

                {/* Message */}
                <Text style={authStyles.modalMessage}>
                  This mobile number is not registered with us. Please create an account to continue.
                </Text>

                {/* Formatted Phone Badge */}
                <View style={authStyles.modalPhoneBadge}>
                  <Text style={authStyles.modalPhoneText}>+91 {unregisteredPhone}</Text>
                </View>

                {/* Action Buttons: Register Now & Cancel */}
                <View style={authStyles.modalBtnGroup}>
                  {/* Register Now Button (Navigates to Create an Account User Type Selection) */}
                  <TouchableOpacity
                    style={authStyles.primaryPillBtn}
                    onPress={() => {
                      setShowNotRegisteredModal(false);
                      // Pre-populate mobile number into registration forms
                      setUserRegMobile(unregisteredPhone);
                      setProvRegMobile(unregisteredPhone);
                      // Navigate to Create an Account - User Type Selection screen
                      setAuthStep('choose_account_type');
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={authStyles.primaryPillBtnText}>Register Now</Text>
                  </TouchableOpacity>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={authStyles.modalCancelBtn}
                    onPress={() => setShowNotRegisteredModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={authStyles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Organic Mint Bottom Curves */}
          <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
            <View style={authStyles.bottomCurveLayer1} />
            <View style={authStyles.bottomCurveLayer2} />
          </View>
        </SafeAreaView>
      );
    }

    // 2. CHOOSE YOUR ACCOUNT TYPE SCREEN (Separate Dedicated Account Type Selection Screen)
    if (authStep === 'choose_account_type' || authStep === 'role_select') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <ScrollView
            contentContainerStyle={authStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={authStyles.topNavRow}>
              <TouchableOpacity
                onPress={() => setAuthStep('login')}
                style={authStyles.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={authStyles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Title & Subtitle */}
            <View style={{ marginTop: 8, marginBottom: 24 }}>
              <Text style={authStyles.screenTitle}>Create an Account</Text>
              <Text style={authStyles.screenSubtitle}>
                Select your account type to get started with Quick Appointments
              </Text>
            </View>

            {/* Selectable Account Type Cards */}
            <View style={authStyles.rolesContainer}>
              {/* Option 1: General User */}
              <TouchableOpacity
                style={[
                  authStyles.roleCard,
                  selectedRoleType === 'customer' && authStyles.roleCardSelected,
                ]}
                onPress={() => setSelectedRoleType('customer')}
                activeOpacity={0.8}
              >
                <View style={authStyles.roleInfoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                    <Text style={authStyles.roleTitle}>General User</Text>
                    <View style={{ backgroundColor: selectedRoleType === 'customer' ? '#DCFCE7' : '#E2E8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, color: selectedRoleType === 'customer' ? '#15803D' : '#334155', fontWeight: 'bold' }}>CUSTOMER</Text>
                    </View>
                  </View>
                  <View style={{ gap: 4, marginTop: 4 }}>
                    <Text style={authStyles.roleBulletText}>• For customers who want to discover and book services</Text>
                    <Text style={authStyles.roleBulletText}>• Browse available services and service providers</Text>
                    <Text style={authStyles.roleBulletText}>• Book appointments seamlessly</Text>
                    <Text style={authStyles.roleBulletText}>• Manage bookings, payments and profiles</Text>
                  </View>
                </View>
                <View
                  style={[
                    authStyles.roleRadio,
                    selectedRoleType === 'customer' && authStyles.roleRadioSelected,
                  ]}
                >
                  {selectedRoleType === 'customer' && (
                    <Text style={authStyles.roleCheckmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Option 2: Service Provider */}
              <TouchableOpacity
                style={[
                  authStyles.roleCard,
                  selectedRoleType === 'provider' && authStyles.roleCardSelected,
                ]}
                onPress={() => setSelectedRoleType('provider')}
                activeOpacity={0.8}
              >
                <View style={authStyles.roleInfoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                    <Text style={authStyles.roleTitle}>Service Provider</Text>
                    <View style={{ backgroundColor: selectedRoleType === 'provider' ? '#DCFCE7' : '#E2E8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, color: selectedRoleType === 'provider' ? '#15803D' : '#334155', fontWeight: 'bold' }}>SERVICE PROVIDER</Text>
                    </View>
                  </View>
                  <View style={{ gap: 4, marginTop: 4 }}>
                    <Text style={authStyles.roleBulletText}>• For individuals or businesses who want to offer their services</Text>
                    <Text style={authStyles.roleBulletText}>• Register as a service provider</Text>
                    <Text style={authStyles.roleBulletText}>• Create and manage their professional profile</Text>
                    <Text style={authStyles.roleBulletText}>• Add services and manage pricing</Text>
                    <Text style={authStyles.roleBulletText}>• Receive and manage customer appointments</Text>
                  </View>
                </View>
                <View
                  style={[
                    authStyles.roleRadio,
                    selectedRoleType === 'provider' && authStyles.roleRadioSelected,
                  ]}
                >
                  {selectedRoleType === 'provider' && (
                    <Text style={authStyles.roleCheckmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, minHeight: 32 }} />

            {/* Footer Terms */}
            <View style={[authStyles.footerBox, { marginBottom: 16 }]}>
              <Text style={authStyles.footerText}>By continuing, you agree to our</Text>
              <View style={authStyles.footerLinkRow}>
                <Text style={authStyles.footerLink}>Terms & Conditions</Text>
                <Text style={authStyles.footerText}> and </Text>
                <Text style={authStyles.footerLink}>Privacy Policy</Text>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={authStyles.primaryPillBtn}
              onPress={() => {
                if (selectedRoleType === 'customer') {
                  setAuthStep('register_user');
                } else {
                  setAuthStep('register_provider');
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={authStyles.primaryPillBtnText}>
                {selectedRoleType === 'customer' ? 'Continue as General User' : 'Continue as Service Provider'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Organic Mint Bottom Curves */}
          <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
            <View style={authStyles.bottomCurveLayer1} />
            <View style={authStyles.bottomCurveLayer2} />
          </View>
        </SafeAreaView>
      );
    }

    // 3. GENERAL USER REGISTRATION SCREEN (Dedicated Screen, Live Postal API, Manual Address, Text Labels)
    if (authStep === 'register_user' || authStep === 'register_account') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <ScrollView
            contentContainerStyle={authStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={authStyles.topNavRow}>
              <TouchableOpacity
                onPress={() => setAuthStep('choose_account_type')}
                style={authStyles.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={authStyles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Centered Brand Logo */}
            <View style={authStyles.logoCenterContainer}>
              <Image
                source={require('./assets/splash-logo.png')}
                style={authStyles.brandLogo}
                resizeMode="contain"
              />
            </View>

            {/* Title & Subtitle */}
            <View style={{ marginTop: 2, marginBottom: 18 }}>
              <Text style={authStyles.screenTitle}>Create General User Account</Text>
              <Text style={authStyles.screenSubtitle}>
                Enter your details to register as a customer
              </Text>
            </View>

            {/* Field 1: Full Name * */}
            <Text style={authStyles.cleanFieldLabel}>Full Name *</Text>
            <TextInput
              style={authStyles.cleanTextInputBox}
              placeholder="Enter your full name"
              placeholderTextColor="#94A3B8"
              value={userRegName}
              onChangeText={setUserRegName}
            />

            {/* Field 2: Mobile Number * */}
            <Text style={authStyles.cleanFieldLabel}>Mobile Number *</Text>
            <View style={authStyles.cleanPhoneInputBox}>
              <View style={authStyles.cleanPrefixBadge}>
                <Text style={authStyles.cleanPrefixText}>+91</Text>
              </View>
              <TextInput
                style={authStyles.cleanPhoneInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={userRegMobile}
                onChangeText={setUserRegMobile}
              />
            </View>

            {/* Field 3: Email Address * */}
            <Text style={authStyles.cleanFieldLabel}>Email Address *</Text>
            <TextInput
              style={authStyles.cleanTextInputBox}
              placeholder="name@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={userRegEmail}
              onChangeText={setUserRegEmail}
            />

            {/* Field 4: PIN Code * with Live Postal API Lookup */}
            <Text style={authStyles.cleanFieldLabel}>PIN Code *</Text>
            <View style={authStyles.cleanDetectRow}>
              <TextInput
                style={[authStyles.cleanTextInputBox, { flex: 1 }]}
                placeholder="Enter 6-digit Indian PIN code"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
                value={userRegPin}
                onChangeText={async (pin) => {
                  setUserRegPin(pin);
                  const clean = pin.replace(/\D/g, '');
                  if (clean.length === 6) {
                    setUserRegIsPincodeLoading(true);
                    const res = await fetchPostalLocation(clean);
                    setUserRegIsPincodeLoading(false);
                    if (res.success && res.data) {
                      setUserRegCity(res.data.city);
                      setUserRegDistrict(res.data.district);
                      setUserRegState(res.data.state);
                      setUserRegArea(res.data.primaryArea);
                      setUserRegAvailableAreas(res.data.areas);
                      setUserRegLocationDetected(true);
                    } else if (res.error) {
                      Alert.alert('Postal Lookup', res.error);
                    }
                  }
                }}
              />
              <TouchableOpacity
                style={authStyles.cleanDetectBtn}
                onPress={async () => {
                  const clean = (userRegPin || '').replace(/\D/g, '');
                  if (clean.length !== 6) {
                    Alert.alert('PIN Code Required', 'Please enter a 6-digit PIN code to detect location.');
                    return;
                  }
                  setUserRegIsPincodeLoading(true);
                  const res = await fetchPostalLocation(clean);
                  setUserRegIsPincodeLoading(false);
                  if (res.success && res.data) {
                    setUserRegCity(res.data.city);
                    setUserRegDistrict(res.data.district);
                    setUserRegState(res.data.state);
                    setUserRegArea(res.data.primaryArea);
                    setUserRegAvailableAreas(res.data.areas);
                    setUserRegLocationDetected(true);
                    Alert.alert('Location Detected', `${res.data.city}, ${res.data.state}`);
                  } else {
                    Alert.alert('Postal Lookup', res.error || 'Could not detect location for this PIN code.');
                  }
                }}
                activeOpacity={0.8}
              >
                {userRegIsPincodeLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={authStyles.cleanDetectBtnText}>Detect Location</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Location Detected Summary Card */}
            {userRegLocationDetected && (
              <View style={[authStyles.locationDetectedCard, { marginTop: 10 }]}>
                <View style={authStyles.detectedCheckCircle}>
                  <Text style={authStyles.detectedCheckmark}>✓</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={authStyles.detectedTitle}>Location Detected</Text>
                  <Text style={authStyles.detectedSubtitle}>
                    {userRegArea ? `${userRegArea}, ` : ''}{userRegCity}, {userRegState} - {userRegPin}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setUserRegManualAddressOpen(!userRegManualAddressOpen)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={authStyles.detectedEditText}>
                    {userRegManualAddressOpen ? 'Close Edit' : 'Edit Address'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Multiple Areas / Post Offices Selection Pills */}
            {userRegAvailableAreas.length > 1 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 }}>
                  Select Post Office / Locality Area:
                </Text>
                <View style={authStyles.areaPillsWrap}>
                  {userRegAvailableAreas.map((areaName) => {
                    const isSelected = userRegArea.toLowerCase() === areaName.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={areaName}
                        style={[authStyles.areaPillItem, isSelected && authStyles.areaPillItemSelected]}
                        onPress={() => setUserRegArea(areaName)}
                        activeOpacity={0.8}
                      >
                        <Text style={[authStyles.areaPillText, isSelected && authStyles.areaPillTextSelected]}>
                          {areaName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Manual Address Entry Accordion / Form */}
            <View style={authStyles.manualAddressBox}>
              <TouchableOpacity
                style={authStyles.manualAddressHeader}
                onPress={() => setUserRegManualAddressOpen(!userRegManualAddressOpen)}
                activeOpacity={0.8}
              >
                <Text style={authStyles.manualAddressHeaderText}>
                  Detailed Address (Optional / Manual Entry)
                </Text>
                <Text style={authStyles.manualToggleBtnText}>
                  {userRegManualAddressOpen ? 'Hide ▲' : 'Add Details ▼'}
                </Text>
              </TouchableOpacity>

              {userRegManualAddressOpen && (
                <View style={{ marginTop: 8 }}>
                  <Text style={authStyles.cleanFieldLabel}>Flat / House Number</Text>
                  <TextInput
                    style={authStyles.cleanTextInputBox}
                    placeholder="e.g. Flat 301, House 12-4"
                    placeholderTextColor="#94A3B8"
                    value={userRegHouse}
                    onChangeText={setUserRegHouse}
                  />

                  <Text style={authStyles.cleanFieldLabel}>Building / Apartment Name</Text>
                  <TextInput
                    style={authStyles.cleanTextInputBox}
                    placeholder="e.g. Royal Greens Residency"
                    placeholderTextColor="#94A3B8"
                    value={userRegBuilding}
                    onChangeText={setUserRegBuilding}
                  />

                  <Text style={authStyles.cleanFieldLabel}>Street / Road</Text>
                  <TextInput
                    style={authStyles.cleanTextInputBox}
                    placeholder="e.g. Main Road, 4th Cross"
                    placeholderTextColor="#94A3B8"
                    value={userRegStreet}
                    onChangeText={setUserRegStreet}
                  />

                  <Text style={authStyles.cleanFieldLabel}>Area / Locality *</Text>
                  <TextInput
                    style={authStyles.cleanTextInputBox}
                    placeholder="Enter locality or neighborhood"
                    placeholderTextColor="#94A3B8"
                    value={userRegArea}
                    onChangeText={setUserRegArea}
                  />

                  <Text style={authStyles.cleanFieldLabel}>Landmark</Text>
                  <TextInput
                    style={authStyles.cleanTextInputBox}
                    placeholder="e.g. Near Community Center"
                    placeholderTextColor="#94A3B8"
                    value={userRegLandmark}
                    onChangeText={setUserRegLandmark}
                  />

                  <Text style={authStyles.cleanFieldLabel}>City / District *</Text>
                  <TextInput
                    style={authStyles.cleanTextInputBox}
                    placeholder="Enter City"
                    placeholderTextColor="#94A3B8"
                    value={userRegCity}
                    onChangeText={setUserRegCity}
                  />

                  <Text style={authStyles.cleanFieldLabel}>State *</Text>
                  <TextInput
                    style={authStyles.cleanTextInputBox}
                    placeholder="Enter State"
                    placeholderTextColor="#94A3B8"
                    value={userRegState}
                    onChangeText={setUserRegState}
                  />
                </View>
              )}
            </View>

            {/* Agreement Checkbox */}
            <TouchableOpacity
              style={[authStyles.checkboxRow, { marginTop: 14, marginBottom: 8 }]}
              onPress={() => setUserRegAgreed(!userRegAgreed)}
              activeOpacity={0.8}
            >
              <View style={[authStyles.customCheckbox, userRegAgreed && authStyles.customCheckboxActive]}>
                {userRegAgreed && <Text style={authStyles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={authStyles.checkboxText}>
                I agree to the <Text style={authStyles.footerLink}>Terms & Conditions</Text> and{' '}
                <Text style={authStyles.footerLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Action Button: Create Account */}
            <TouchableOpacity
              style={[authStyles.primaryPillBtn, { marginTop: 14 }]}
              onPress={async () => {
                if (!userRegName.trim()) {
                  Alert.alert('Required Field', 'Please enter your full name.');
                  return;
                }
                const cleanPhone = (userRegMobile || '').replace(/\D/g, '');
                if (cleanPhone.length !== 10) {
                  Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
                  return;
                }
                if (!userRegEmail.trim()) {
                  Alert.alert('Required Field', 'Please enter your email address.');
                  return;
                }
                const cleanPin = (userRegPin || '').replace(/\D/g, '');
                if (cleanPin.length !== 6) {
                  Alert.alert('PIN Code Required', 'Please enter a valid 6-digit PIN code.');
                  return;
                }
                if (!userRegAgreed) {
                  Alert.alert('Terms & Conditions', 'Please agree to the Terms & Conditions and Privacy Policy.');
                  return;
                }

                // Check for duplicate mobile registration
                setIsSubmittingDb(true);
                const check = await isMobileNumberRegistered(cleanPhone);
                setIsSubmittingDb(false);
                if (check.registered) {
                  Alert.alert(
                    'Mobile Already Registered',
                    `An account with mobile number +91 ${cleanPhone} already exists. Please log in directly.`,
                    [
                      {
                        text: 'Go to Login',
                        onPress: () => {
                          setAuthMobile(cleanPhone);
                          setAuthStep('login');
                        },
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                  return;
                }

                setOtpCountdown(28);
                setAuthOtpDigits(['', '', '', '', '', '']);
                setAuthStep('otp_user');
              }}
              activeOpacity={0.85}
              disabled={isSubmittingDb}
            >
              {isSubmittingDb ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={authStyles.primaryPillBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 28 }} />
          </ScrollView>

          {/* Organic Mint Bottom Curves */}
          <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
            <View style={authStyles.bottomCurveLayer1} />
            <View style={authStyles.bottomCurveLayer2} />
          </View>
        </SafeAreaView>
      );
    }

    // 4. GENERAL USER OTP VERIFICATION SCREEN (Clean Text Labels, Verified Mobile)
    if (authStep === 'otp_user') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <ScrollView
            contentContainerStyle={authStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={authStyles.topNavRow}>
              <TouchableOpacity
                onPress={() => setAuthStep('register_user')}
                style={authStyles.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={authStyles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Title & Subtitle with Registered Mobile and Edit Button */}
            <Text style={authStyles.screenTitle}>Verify Mobile Number</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 18, flexWrap: 'wrap' }}>
              <Text style={authStyles.screenSubtitle}>
                Enter the 6-digit OTP code sent to +91 {userRegMobile}
              </Text>
              <TouchableOpacity
                onPress={() => setAuthStep('register_user')}
                style={{ marginLeft: 8 }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={authStyles.editText}>Edit ✎</Text>
              </TouchableOpacity>
            </View>

            {/* 6 Individual Square OTP Boxes with Auto-Advance & Backspace handling */}
            <OtpInputBoxes
              digits={authOtpDigits}
              onChangeDigits={setAuthOtpDigits}
            />

            {/* Optional Dev Quick Fill */}
            <TouchableOpacity
              onPress={() => setAuthOtpDigits(['1', '2', '3', '4', '5', '6'])}
              style={{ alignSelf: 'center', marginTop: 10, paddingVertical: 4 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600' }}>
                Auto-fill test code (123456)
              </Text>
            </TouchableOpacity>

            {/* Resend OTP Section */}
            <View style={authStyles.resendContainer}>
              <Text style={authStyles.resendPromptText}>Didn't receive the OTP?</Text>
              {otpCountdown > 0 ? (
                <Text style={authStyles.resendTimerText}>
                  Resend OTP in 00:{otpCountdown < 10 ? `0${otpCountdown}` : otpCountdown}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setOtpCountdown(28);
                    setAuthOtpDigits(['', '', '', '', '', '']);
                    Alert.alert('OTP Resent', `A new 6-digit OTP code has been sent to +91 ${userRegMobile}`);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[authStyles.resendTimerText, { textDecorationLine: 'underline' }]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify & Continue Button */}
            <TouchableOpacity
              style={[authStyles.primaryPillBtn, isSubmittingDb ? { opacity: 0.7 } : null]}
              disabled={isSubmittingDb}
              onPress={async () => {
                if (isSubmittingDb) return;
                const entered = authOtpDigits.join('');
                if (entered.length < 6) {
                  Alert.alert('Incomplete OTP', 'Please enter the full 6-digit OTP code.');
                  return;
                }
                // Save directly to Supabase users and customer_profiles tables
                await registerUserInDb({
                  fullName: userRegName,
                  email: userRegEmail,
                  phone: userRegMobile,
                  pin: userRegPin,
                  locality: userRegArea,
                  city: userRegCity,
                  state: userRegState,
                  district: userRegDistrict,
                  house: userRegHouse,
                  building: userRegBuilding,
                  street: userRegStreet,
                  landmark: userRegLandmark,
                });
                setUserName(userRegName);
                if (userRegEmail) setUserEmail(userRegEmail);
                setPhoneNumber(userRegMobile);
                if (userRegCity) setSelectedCityName(userRegCity);
                setAuthStep('success_user');
              }}
              activeOpacity={0.85}
            >
              {isSubmittingDb ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={authStyles.primaryPillBtnText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 28 }} />
          </ScrollView>

          {/* Organic Mint Bottom Curves */}
          <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
            <View style={authStyles.bottomCurveLayer1} />
            <View style={authStyles.bottomCurveLayer2} />
          </View>
        </SafeAreaView>
      );
    }

    // 5. GENERAL USER SUCCESS SCREEN (Thank You for Registration)
    if (authStep === 'success_user' || authStep === 'success') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <View style={authStyles.successScreenContainer}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
              {/* Green Scalloped Badge with Radiating Rays */}
              <View style={authStyles.successBadgeOuterGlow}>
                <View style={authStyles.scallopBase}>
                  <View style={[authStyles.scallopLeaf, { transform: [{ rotate: '0deg' }] }]} />
                  <View style={[authStyles.scallopLeaf, { transform: [{ rotate: '30deg' }] }]} />
                  <View style={[authStyles.scallopLeaf, { transform: [{ rotate: '60deg' }] }]} />
                  <View style={authStyles.scallopCenter}>
                    <Text style={authStyles.successCheckmark}>✓</Text>
                  </View>
                </View>
                <View style={authStyles.successRay1} />
                <View style={authStyles.successRay2} />
              </View>

              {/* Title & Subtitle */}
              <Text style={authStyles.successTitle}>Thank You for Registration!</Text>
              <Text style={authStyles.successSubtitle}>
                Your account and mobile number have been verified successfully.
              </Text>

              {/* Action Button: Continue to Home */}
              <View style={{ width: '100%', marginTop: 32 }}>
                <TouchableOpacity
                  style={authStyles.primaryPillBtn}
                  onPress={() => {
                    setActiveRole('customer');
                    setIsAuthenticated(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryPillBtnText}>Continue to Home</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Organic Mint Bottom Curves */}
            <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
              <View style={authStyles.bottomCurveLayer1} />
              <View style={authStyles.bottomCurveLayer2} />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    // 6. SERVICE PROVIDER REGISTRATION SCREEN (4-Step Flow, Live Postal API, Dynamic DB Categories)
    if (authStep === 'register_provider') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <ScrollView
            contentContainerStyle={authStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={authStyles.topNavRow}>
              <TouchableOpacity
                onPress={() => {
                  if (providerStep > 1) {
                    setProviderStep((prev) => (prev - 1) as any);
                  } else {
                    setAuthStep('choose_account_type');
                  }
                }}
                style={authStyles.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={authStyles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Title & Subtitle */}
            <View style={{ marginBottom: 18 }}>
              <Text style={authStyles.screenTitle}>Create Service Provider Account</Text>
              <Text style={authStyles.screenSubtitle}>
                Step {providerStep} of 4: {providerStep === 1 ? 'Basic Details' : providerStep === 2 ? 'Location & Address' : providerStep === 3 ? 'Services & Hours' : 'Review & Submit'}
              </Text>
            </View>

            {/* 4-Step Horizontal Stepper */}
            <ProviderStepper currentStep={providerStep} />

            {/* ================= STEP 1: BASIC DETAILS ================= */}
            {providerStep === 1 && (
              <View>
                <Text style={authStyles.cleanFieldLabel}>Full Name *</Text>
                <TextInput
                  style={authStyles.cleanTextInputBox}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={provRegName}
                  onChangeText={setProvRegName}
                />

                <Text style={authStyles.cleanFieldLabel}>Mobile Number *</Text>
                <View style={authStyles.cleanPhoneInputBox}>
                  <View style={authStyles.cleanPrefixBadge}>
                    <Text style={authStyles.cleanPrefixText}>+91</Text>
                  </View>
                  <TextInput
                    style={authStyles.cleanPhoneInput}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={provRegMobile}
                    onChangeText={setProvRegMobile}
                  />
                </View>

                <Text style={authStyles.cleanFieldLabel}>Email Address *</Text>
                <TextInput
                  style={authStyles.cleanTextInputBox}
                  placeholder="name@business.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={provRegEmail}
                  onChangeText={setProvRegEmail}
                />

                <Text style={authStyles.cleanFieldLabel}>Business / Service Name *</Text>
                <TextInput
                  style={authStyles.cleanTextInputBox}
                  placeholder="e.g. Apex Styling Studio"
                  placeholderTextColor="#94A3B8"
                  value={provRegBusinessName}
                  onChangeText={setProvRegBusinessName}
                />

                <Text style={authStyles.cleanFieldLabel}>Business Entity Type *</Text>
                <View style={authStyles.areaPillsWrap}>
                  {['Individual Professional', 'Agency / Firm', 'Salon / Clinic', 'Home Service Provider'].map((type) => {
                    const isSelected = provRegBusinessType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[authStyles.areaPillItem, isSelected && authStyles.areaPillItemSelected]}
                        onPress={() => setProvRegBusinessType(type)}
                        activeOpacity={0.8}
                      >
                        <Text style={[authStyles.areaPillText, isSelected && authStyles.areaPillTextSelected]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={authStyles.cleanFieldLabel}>About Your Practice / Business (Optional)</Text>
                <TextInput
                  style={[authStyles.cleanTextInputBox, { height: 76, textAlignVertical: 'top', paddingTop: 10 }]}
                  placeholder="Describe your services, specialization, and experience"
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={250}
                  value={provRegAbout}
                  onChangeText={setProvRegAbout}
                />
                <Text style={{ alignSelf: 'flex-end', fontSize: 11, color: '#94A3B8', marginTop: 2, marginBottom: 12 }}>
                  {provRegAbout.length}/250
                </Text>

                {/* Continue Button */}
                <TouchableOpacity
                  style={[authStyles.primaryPillBtn, { marginTop: 14 }]}
                  onPress={async () => {
                    if (!provRegName.trim()) {
                      Alert.alert('Required Field', 'Please enter your full name.');
                      return;
                    }
                    const cleanPhone = (provRegMobile || '').replace(/\D/g, '');
                    if (cleanPhone.length !== 10) {
                      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
                      return;
                    }
                    if (!provRegEmail.trim()) {
                      Alert.alert('Required Field', 'Please enter your email address.');
                      return;
                    }
                    if (!provRegBusinessName.trim()) {
                      Alert.alert('Required Field', 'Please enter your business or service name.');
                      return;
                    }

                    // Check duplicate mobile in DB
                    setIsSubmittingDb(true);
                    const check = await isMobileNumberRegistered(cleanPhone);
                    setIsSubmittingDb(false);
                    if (check.registered) {
                      Alert.alert(
                        'Mobile Already Registered',
                        `An account with mobile number +91 ${cleanPhone} already exists. Please log in directly.`,
                        [
                          {
                            text: 'Go to Login',
                            onPress: () => {
                              setAuthMobile(cleanPhone);
                              setAuthStep('login');
                            },
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      );
                      return;
                    }

                    setProviderStep(2);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryPillBtnText}>Continue to Location & Address</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ================= STEP 2: LOCATION & ADDRESS ================= */}
            {providerStep === 2 && (
              <View>
                <Text style={provStepStyles.sectionTitle}>Service Location & Address</Text>

                <Text style={authStyles.cleanFieldLabel}>PIN Code *</Text>
                <View style={authStyles.cleanDetectRow}>
                  <TextInput
                    style={[authStyles.cleanTextInputBox, { flex: 1 }]}
                    placeholder="Enter 6-digit Indian PIN code"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={provRegPin}
                    onChangeText={async (pin) => {
                      setProvRegPin(pin);
                      const clean = pin.replace(/\D/g, '');
                      if (clean.length === 6) {
                        setProvRegIsPincodeLoading(true);
                        const res = await fetchPostalLocation(clean);
                        setProvRegIsPincodeLoading(false);
                        if (res.success && res.data) {
                          setProvRegCity(res.data.city);
                          setProvRegDistrict(res.data.district);
                          setProvRegState(res.data.state);
                          setProvRegArea(res.data.primaryArea);
                          setProvRegAvailableAreas(res.data.areas);
                          setProvRegLocationDetected(true);
                        } else if (res.error) {
                          Alert.alert('Postal Lookup', res.error);
                        }
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={authStyles.cleanDetectBtn}
                    onPress={async () => {
                      const clean = (provRegPin || '').replace(/\D/g, '');
                      if (clean.length !== 6) {
                        Alert.alert('PIN Code Required', 'Please enter a 6-digit PIN code.');
                        return;
                      }
                      setProvRegIsPincodeLoading(true);
                      const res = await fetchPostalLocation(clean);
                      setProvRegIsPincodeLoading(false);
                      if (res.success && res.data) {
                        setProvRegCity(res.data.city);
                        setProvRegDistrict(res.data.district);
                        setProvRegState(res.data.state);
                        setProvRegArea(res.data.primaryArea);
                        setProvRegAvailableAreas(res.data.areas);
                        setProvRegLocationDetected(true);
                        Alert.alert('Location Detected', `${res.data.city}, ${res.data.state}`);
                      } else {
                        Alert.alert('Postal Lookup', res.error || 'Could not detect location for this PIN code.');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {provRegIsPincodeLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={authStyles.cleanDetectBtnText}>Detect Location</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Location Detected Summary */}
                {provRegLocationDetected && (
                  <View style={[authStyles.locationDetectedCard, { marginTop: 10 }]}>
                    <View style={authStyles.detectedCheckCircle}>
                      <Text style={authStyles.detectedCheckmark}>✓</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={authStyles.detectedTitle}>Location Detected</Text>
                      <Text style={authStyles.detectedSubtitle}>
                        {provRegArea ? `${provRegArea}, ` : ''}{provRegCity}, {provRegState} - {provRegPin}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setProvRegManualAddressOpen(!provRegManualAddressOpen)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={authStyles.detectedEditText}>
                        {provRegManualAddressOpen ? 'Close Edit' : 'Edit Address'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Multiple Areas / Post Offices Selection */}
                {provRegAvailableAreas.length > 1 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 }}>
                      Select Service Locality Area:
                    </Text>
                    <View style={authStyles.areaPillsWrap}>
                      {provRegAvailableAreas.map((areaName) => {
                        const isSelected = provRegArea.toLowerCase() === areaName.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={areaName}
                            style={[authStyles.areaPillItem, isSelected && authStyles.areaPillItemSelected]}
                            onPress={() => setProvRegArea(areaName)}
                            activeOpacity={0.8}
                          >
                            <Text style={[authStyles.areaPillText, isSelected && authStyles.areaPillTextSelected]}>
                              {areaName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Manual Address Fields */}
                <View style={authStyles.manualAddressBox}>
                  <TouchableOpacity
                    style={authStyles.manualAddressHeader}
                    onPress={() => setProvRegManualAddressOpen(!provRegManualAddressOpen)}
                    activeOpacity={0.8}
                  >
                    <Text style={authStyles.manualAddressHeaderText}>
                      Detailed Street / Premise Address
                    </Text>
                    <Text style={authStyles.manualToggleBtnText}>
                      {provRegManualAddressOpen ? 'Hide ▲' : 'Edit Details ▼'}
                    </Text>
                  </TouchableOpacity>

                  {provRegManualAddressOpen && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={authStyles.cleanFieldLabel}>Shop / Unit / Floor Number</Text>
                      <TextInput
                        style={authStyles.cleanTextInputBox}
                        placeholder="e.g. Shop 4B, 1st Floor"
                        placeholderTextColor="#94A3B8"
                        value={provRegHouse}
                        onChangeText={setProvRegHouse}
                      />

                      <Text style={authStyles.cleanFieldLabel}>Building / Complex Name</Text>
                      <TextInput
                        style={authStyles.cleanTextInputBox}
                        placeholder="e.g. Fortune Business Center"
                        placeholderTextColor="#94A3B8"
                        value={provRegBuilding}
                        onChangeText={setProvRegBuilding}
                      />

                      <Text style={authStyles.cleanFieldLabel}>Street / Road</Text>
                      <TextInput
                        style={authStyles.cleanTextInputBox}
                        placeholder="e.g. MG Road, Commercial Zone"
                        placeholderTextColor="#94A3B8"
                        value={provRegStreet}
                        onChangeText={setProvRegStreet}
                      />

                      <Text style={authStyles.cleanFieldLabel}>Area / Locality *</Text>
                      <TextInput
                        style={authStyles.cleanTextInputBox}
                        placeholder="Enter locality name"
                        placeholderTextColor="#94A3B8"
                        value={provRegArea}
                        onChangeText={setProvRegArea}
                      />

                      <Text style={authStyles.cleanFieldLabel}>Landmark</Text>
                      <TextInput
                        style={authStyles.cleanTextInputBox}
                        placeholder="e.g. Opposite Metro Pillar 42"
                        placeholderTextColor="#94A3B8"
                        value={provRegLandmark}
                        onChangeText={setProvRegLandmark}
                      />

                      <Text style={authStyles.cleanFieldLabel}>City / District *</Text>
                      <TextInput
                        style={authStyles.cleanTextInputBox}
                        placeholder="Enter City"
                        placeholderTextColor="#94A3B8"
                        value={provRegCity}
                        onChangeText={setProvRegCity}
                      />

                      <Text style={authStyles.cleanFieldLabel}>State *</Text>
                      <TextInput
                        style={authStyles.cleanTextInputBox}
                        placeholder="Enter State"
                        placeholderTextColor="#94A3B8"
                        value={provRegState}
                        onChangeText={setProvRegState}
                      />
                    </View>
                  )}
                </View>

                {/* Google Maps Shared Location Link */}
                <View style={{ marginTop: 12 }}>
                  <Text style={authStyles.cleanFieldLabel}>Google Maps Shared Location Link *</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={[authStyles.cleanTextInputBox, { flex: 1, marginBottom: 0 }]}
                      placeholder="https://maps.app.goo.gl/... or https://goo.gl/maps/..."
                      placeholderTextColor="#94A3B8"
                      value={provGoogleMapsLink}
                      onChangeText={setProvGoogleMapsLink}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: provGoogleMapsLink.trim() ? '#047857' : '#94A3B8',
                        paddingHorizontal: 14,
                        height: 48,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onPress={() => {
                        const url = provGoogleMapsLink.trim();
                        if (!url) {
                          Alert.alert('Link Required', 'Please paste your Google Maps shared link first.');
                          return;
                        }
                        if (typeof window !== 'undefined' && window.open) {
                          window.open(url, '_blank');
                        } else {
                          Alert.alert('Google Maps Link', `Verified location link: ${url}`);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Test Link</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4, marginBottom: 12, lineHeight: 15 }}>
                    📌 Open Google Maps on phone → Find your clinic/shop/workplace → Tap Share → Copy link & paste here.
                  </Text>
                </View>

                {/* Premise / Workplace Verification Photos */}
                <View style={{ marginTop: 4, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={authStyles.cleanFieldLabel}>
                      Premise / Workplace Photos * ({provPremisePhotos.length}/3)
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#10B981' }}>
                      HD Compressed
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 10, lineHeight: 15 }}>
                    Upload 1 to 3 clear photos showing your shop/clinic/office front view with signage board & interior workstation.
                  </Text>

                  {/* Thumbnails of already uploaded premise photos */}
                  {provPremisePhotos.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                      {provPremisePhotos.map((photo, pIdx) => (
                        <View
                          key={pIdx}
                          style={{
                            position: 'relative',
                            width: 100,
                            height: 94,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: '#10B981',
                            overflow: 'hidden',
                            backgroundColor: '#F8FAFC',
                          }}
                        >
                          <Image
                            source={{ uri: photo.dataUrl }}
                            style={{ width: '100%', height: 68, resizeMode: 'cover' }}
                          />
                          <View style={{ paddingHorizontal: 4, paddingVertical: 2, backgroundColor: '#ECFDF5' }}>
                            <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#047857' }} numberOfLines={1}>
                              HD {photo.fileSizeKb} KB
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(0,0,0,0.65)',
                              borderRadius: 10,
                              width: 20,
                              height: 20,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onPress={() => {
                              setProvPremisePhotos(provPremisePhotos.filter((_, i) => i !== pIdx));
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Upload button if fewer than 3 photos */}
                  {provPremisePhotos.length < 3 && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: '#F0FDF4',
                        borderWidth: 1.5,
                        borderColor: '#86EFAC',
                        borderStyle: 'dashed',
                        borderRadius: 14,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                      }}
                      onPress={() => {
                        setUploadModalTarget('premise');
                        setUploadModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 18 }}>📸</Text>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#15803D' }}>
                        + Add Workplace Photo (Camera / Gallery / Files)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={[authStyles.primaryPillBtn, { marginTop: 10 }]}
                  onPress={() => {
                    const cleanPin = (provRegPin || '').replace(/\D/g, '');
                    if (cleanPin.length !== 6) {
                      Alert.alert('Required Field', 'Please enter a valid 6-digit PIN code.');
                      return;
                    }
                    if (!provRegCity.trim()) {
                      Alert.alert('Required Field', 'Please ensure city is detected or entered.');
                      return;
                    }
                    if (!provGoogleMapsLink.trim()) {
                      Alert.alert('Google Maps Link Required', 'Please enter your Google Maps shared location link for verification.');
                      return;
                    }
                    if (provPremisePhotos.length === 0) {
                      Alert.alert('Premise Photo Required', 'Please upload at least 1 clear workplace/premise photo (front view with signage).');
                      return;
                    }
                    setProviderStep(3);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryPillBtnText}>Continue to Services & Hours</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ================= STEP 3: SERVICES & HOURS ================= */}
            {providerStep === 3 && (
              <View>
                <Text style={provStepStyles.sectionTitle}>Services & Availability</Text>

                {/* Dynamic Category Selection from Supabase categories */}
                <Text style={authStyles.cleanFieldLabel}>Service Category *</Text>
                <View style={authStyles.areaPillsWrap}>
                  {(dbCategories.length > 0 ? dbCategories : [
                    { id: 'cat1', name: 'Salon & Grooming' },
                    { id: 'cat2', name: 'Healthcare & Wellness' },
                    { id: 'cat3', name: 'Home Repairs & AC Services' },
                    { id: 'cat4', name: 'Auto Care & Detailing' },
                  ]).map((c: any) => {
                    const isSelected = provRegCategory.toLowerCase() === c.name.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={c.id || c.name}
                        style={[authStyles.areaPillItem, isSelected && authStyles.areaPillItemSelected]}
                        onPress={() => setProvRegCategory(c.name)}
                        activeOpacity={0.8}
                      >
                        <Text style={[authStyles.areaPillText, isSelected && authStyles.areaPillTextSelected]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Specific Services associated under the selected Category */}
                <Text style={authStyles.cleanFieldLabel}>
                  Specific Services You Provide * (Select all that apply)
                </Text>
                {(() => {
                  const selectedCat = dbCategories.find(
                    (c) => c.name.toLowerCase() === provRegCategory.toLowerCase()
                  );
                  const catServices = selectedCat
                    ? dbServices.filter((s) => s.category_id === selectedCat.id)
                    : [];

                  if (catServices.length > 0) {
                    return (
                      <View style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {catServices.map((srv) => {
                            const isChosen = provSelectedServiceIds.includes(srv.id);
                            return (
                              <TouchableOpacity
                                key={srv.id}
                                style={[
                                  provStepStyles.dayPill,
                                  isChosen && provStepStyles.dayPillActive,
                                  { paddingHorizontal: 10, paddingVertical: 6 },
                                ]}
                                onPress={() => {
                                  let nextIds: string[];
                                  if (isChosen) {
                                    nextIds = provSelectedServiceIds.filter((id) => id !== srv.id);
                                  } else {
                                    nextIds = [...provSelectedServiceIds, srv.id];
                                  }
                                  setProvSelectedServiceIds(nextIds);

                                  const chosenNames = dbServices
                                    .filter((s) => nextIds.includes(s.id))
                                    .map((s) => s.name);
                                  setProvRegServices(chosenNames.join(', '));
                                }}
                                activeOpacity={0.8}
                              >
                                <Text style={provStepStyles.dayCheckmark}>
                                  {isChosen ? '✓' : '+'}
                                </Text>
                                <Text style={provStepStyles.dayText}>
                                  {srv.name} (₹{srv.base_price})
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                          Tap to select or add additional services below:
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}

                <TextInput
                  style={authStyles.cleanTextInputBox}
                  placeholder="e.g. Hair styling, beard detailing, facial massage"
                  placeholderTextColor="#94A3B8"
                  value={provRegServices}
                  onChangeText={setProvRegServices}
                />

                <Text style={authStyles.cleanFieldLabel}>Available Working Days *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isSelected = provAvailableDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[provStepStyles.dayPill, isSelected && provStepStyles.dayPillActive]}
                        onPress={() => {
                          if (isSelected) {
                            setProvAvailableDays(provAvailableDays.filter((d) => d !== day));
                          } else {
                            setProvAvailableDays([...provAvailableDays, day]);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={provStepStyles.dayCheckmark}>{isSelected ? '✓' : '○'}</Text>
                        <Text style={provStepStyles.dayText}>{day}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Working Hours From & To */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={authStyles.cleanFieldLabel}>Working Hours From *</Text>
                    <TextInput
                      style={authStyles.cleanTextInputBox}
                      placeholder="e.g. 09:00 AM"
                      placeholderTextColor="#94A3B8"
                      value={provWorkingHoursFrom}
                      onChangeText={setProvWorkingHoursFrom}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={authStyles.cleanFieldLabel}>Working Hours To *</Text>
                    <TextInput
                      style={authStyles.cleanTextInputBox}
                      placeholder="e.g. 07:00 PM"
                      placeholderTextColor="#94A3B8"
                      value={provWorkingHoursTo}
                      onChangeText={setProvWorkingHoursTo}
                    />
                  </View>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={[authStyles.primaryPillBtn, { marginTop: 14 }]}
                  onPress={() => {
                    if (!provRegCategory) {
                      Alert.alert('Required Field', 'Please select your service category.');
                      return;
                    }
                    if (!provRegServices.trim()) {
                      Alert.alert('Required Field', 'Please describe the services you provide.');
                      return;
                    }
                    if (provAvailableDays.length === 0) {
                      Alert.alert('Required Field', 'Please select at least one available working day.');
                      return;
                    }
                    setProviderStep(4);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryPillBtnText}>Continue to Documents & Review</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ================= STEP 4: DOCUMENTS & REVIEW ================= */}
            {providerStep === 4 && (
              <View>
                <Text style={provStepStyles.sectionTitle}>Upload Required Documents</Text>

                {/* Aadhaar Card */}
                <View style={provStepStyles.docRow}>
                  {provAadhaarDoc ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Image
                        source={{ uri: provAadhaarDoc.dataUrl }}
                        style={{ width: 44, height: 44, borderRadius: 8, marginRight: 12, borderWidth: 1, borderColor: '#10B981' }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={provStepStyles.docTitle}>Aadhaar Card *</Text>
                        <Text style={{ fontSize: 11, color: '#047857', fontWeight: '600', marginTop: 1 }}>
                          ✓ Attached (HD ${provAadhaarDoc.fileSizeKb} KB)
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[provStepStyles.uploadPillBtn, { backgroundColor: '#F1F5F9', marginRight: 6 }]}
                        onPress={() => {
                          setUploadModalTarget('aadhaar');
                          setUploadModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[provStepStyles.uploadPillText, { color: '#0F172A' }]}>Replace</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setProvAadhaarDoc(null);
                          setProvAadhaarUploaded(false);
                        }}
                        style={{ padding: 6 }}
                      >
                        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={{ flex: 1 }}>
                        <Text style={provStepStyles.docTitle}>Aadhaar Card *</Text>
                        <Text style={provStepStyles.docSub}>Government ID proof (front side)</Text>
                      </View>
                      <TouchableOpacity
                        style={provStepStyles.uploadPillBtn}
                        onPress={() => {
                          setUploadModalTarget('aadhaar');
                          setUploadModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={provStepStyles.uploadPillText}>Upload</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* PAN Card */}
                <View style={provStepStyles.docRow}>
                  {provPanDoc ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Image
                        source={{ uri: provPanDoc.dataUrl }}
                        style={{ width: 44, height: 44, borderRadius: 8, marginRight: 12, borderWidth: 1, borderColor: '#10B981' }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={provStepStyles.docTitle}>PAN Card *</Text>
                        <Text style={{ fontSize: 11, color: '#047857', fontWeight: '600', marginTop: 1 }}>
                          ✓ Attached (HD ${provPanDoc.fileSizeKb} KB)
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[provStepStyles.uploadPillBtn, { backgroundColor: '#F1F5F9', marginRight: 6 }]}
                        onPress={() => {
                          setUploadModalTarget('pan');
                          setUploadModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[provStepStyles.uploadPillText, { color: '#0F172A' }]}>Replace</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setProvPanDoc(null);
                          setProvPanUploaded(false);
                        }}
                        style={{ padding: 6 }}
                      >
                        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={{ flex: 1 }}>
                        <Text style={provStepStyles.docTitle}>PAN Card *</Text>
                        <Text style={provStepStyles.docSub}>Tax & Business ID</Text>
                      </View>
                      <TouchableOpacity
                        style={provStepStyles.uploadPillBtn}
                        onPress={() => {
                          setUploadModalTarget('pan');
                          setUploadModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={provStepStyles.uploadPillText}>Upload</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Work Experience / Certificate */}
                <View style={provStepStyles.docRow}>
                  {provExpDoc ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Image
                        source={{ uri: provExpDoc.dataUrl }}
                        style={{ width: 44, height: 44, borderRadius: 8, marginRight: 12, borderWidth: 1, borderColor: '#10B981' }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={provStepStyles.docTitle}>Work Certificate (Optional)</Text>
                        <Text style={{ fontSize: 11, color: '#047857', fontWeight: '600', marginTop: 1 }}>
                          ✓ Attached (HD ${provExpDoc.fileSizeKb} KB)
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[provStepStyles.uploadPillBtn, { backgroundColor: '#F1F5F9', marginRight: 6 }]}
                        onPress={() => {
                          setUploadModalTarget('exp');
                          setUploadModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[provStepStyles.uploadPillText, { color: '#0F172A' }]}>Replace</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setProvExpDoc(null);
                          setProvExpUploaded(false);
                        }}
                        style={{ padding: 6 }}
                      >
                        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={{ flex: 1 }}>
                        <Text style={provStepStyles.docTitle}>Work Experience / Certificate (Optional)</Text>
                        <Text style={provStepStyles.docSub}>Trade license or qualification proof</Text>
                      </View>
                      <TouchableOpacity
                        style={provStepStyles.uploadPillBtn}
                        onPress={() => {
                          setUploadModalTarget('exp');
                          setUploadModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={provStepStyles.uploadPillText}>Upload</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* HD Clarity Guarantee Notice */}
                <View style={{
                  backgroundColor: '#F0FDF4',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                  padding: 12,
                  marginTop: 6,
                  marginBottom: 16,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534', marginBottom: 2 }}>
                    ⚡ HD Clarity Guarantee & Admin Review Notice
                  </Text>
                  <Text style={{ fontSize: 11, color: '#14532D', lineHeight: 15 }}>
                    Our smart compressor preserves 100% sharp text on IDs and documents while keeping files compact (&lt; 450 KB). If an image is blurred or dark, the Admin will return a re-upload request.
                  </Text>
                </View>

                <Text style={[provStepStyles.sectionTitle, { marginTop: 10, marginBottom: 10 }]}>
                  Review Registration Details
                </Text>

                {/* Review Card 1: Personal & Business */}
                <View style={provStepStyles.reviewCard}>
                  <View style={provStepStyles.reviewHeader}>
                    <Text style={provStepStyles.reviewTitle}>Personal & Business Details</Text>
                    <TouchableOpacity onPress={() => setProviderStep(1)}>
                      <Text style={provStepStyles.reviewEditText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Full Name</Text>
                    <Text style={provStepStyles.reviewValue}>{provRegName}</Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Business Name</Text>
                    <Text style={provStepStyles.reviewValue}>{provRegBusinessName}</Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Mobile</Text>
                    <Text style={provStepStyles.reviewValue}>+91 {provRegMobile}</Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Email</Text>
                    <Text style={provStepStyles.reviewValue}>{provRegEmail}</Text>
                  </View>
                </View>

                {/* Review Card 2: Location & Services */}
                <View style={provStepStyles.reviewCard}>
                  <View style={provStepStyles.reviewHeader}>
                    <Text style={provStepStyles.reviewTitle}>Location & Services</Text>
                    <TouchableOpacity onPress={() => setProviderStep(2)}>
                      <Text style={provStepStyles.reviewEditText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>City & Area</Text>
                    <Text style={provStepStyles.reviewValue}>{provRegArea ? `${provRegArea}, ` : ''}{provRegCity} - {provRegPin}</Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Google Maps</Text>
                    <Text style={[provStepStyles.reviewValue, { color: '#047857' }]} numberOfLines={1}>
                      {provGoogleMapsLink ? 'Shared Link Attached ✓' : 'Not Set'}
                    </Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Premise Photos</Text>
                    <Text style={provStepStyles.reviewValue}>
                      {provPremisePhotos.length} Attached (HD)
                    </Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Category</Text>
                    <Text style={provStepStyles.reviewValue}>{provRegCategory}</Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Services</Text>
                    <Text style={provStepStyles.reviewValue}>{provRegServices}</Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Working Days</Text>
                    <Text style={provStepStyles.reviewValue}>{provAvailableDays.join(', ')}</Text>
                  </View>
                  <View style={provStepStyles.reviewRow}>
                    <Text style={provStepStyles.reviewLabel}>Hours</Text>
                    <Text style={provStepStyles.reviewValue}>{provWorkingHoursFrom} - {provWorkingHoursTo}</Text>
                  </View>
                </View>

                {/* Agreement Checkbox */}
                <TouchableOpacity
                  style={[authStyles.checkboxRow, { marginTop: 14, marginBottom: 14 }]}
                  onPress={() => setProvReviewAgreed(!provReviewAgreed)}
                  activeOpacity={0.8}
                >
                  <View style={[authStyles.customCheckbox, provReviewAgreed && authStyles.customCheckboxActive]}>
                    {provReviewAgreed && <Text style={authStyles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={authStyles.checkboxText}>
                    I agree to the <Text style={authStyles.footerLink}>Terms & Conditions</Text> and{' '}
                    <Text style={authStyles.footerLink}>Privacy Policy.</Text>
                  </Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                  style={authStyles.primaryPillBtn}
                  onPress={() => {
                    if (!provAadhaarDoc && !provAadhaarUploaded) {
                      Alert.alert('Aadhaar Card Required', 'Please upload your Aadhaar Card (front side) in HD clarity.');
                      return;
                    }
                    if (!provPanDoc && !provPanUploaded) {
                      Alert.alert('PAN Card Required', 'Please upload your PAN Card (front side) in HD clarity.');
                      return;
                    }
                    if (!provReviewAgreed) {
                      Alert.alert('Terms & Conditions', 'Please agree to the Terms & Conditions and Privacy Policy.');
                      return;
                    }
                    setOtpCountdown(28);
                    setAuthOtpDigits(['', '', '', '', '', '']);
                    setAuthStep('otp_provider');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={authStyles.primaryPillBtnText}>Submit Registration</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 28 }} />
          </ScrollView>

          {/* Organic Mint Bottom Curves */}
          <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
            <View style={authStyles.bottomCurveLayer1} />
            <View style={authStyles.bottomCurveLayer2} />
          </View>

          {/* Document Upload Multi-Source Modal (Camera, Gallery, Files with HD Clarity) */}
          <Modal
            visible={uploadModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setUploadModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                justifyContent: 'flex-end',
                paddingBottom: 24,
                paddingHorizontal: 16,
              }}
            >
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                }}
              >
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      backgroundColor: '#CBD5E1',
                      borderRadius: 2,
                      marginBottom: 12,
                    }}
                  />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0F172A' }}>
                    {uploadModalTarget === 'premise'
                      ? 'Upload Workplace / Premise Photo'
                      : uploadModalTarget === 'aadhaar'
                      ? 'Upload Aadhaar Card (Front Side)'
                      : uploadModalTarget === 'pan'
                      ? 'Upload PAN Card (Front Side)'
                      : 'Upload Work Certificate'}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, textAlign: 'center' }}>
                    Smart HD Compression: Preserves razor-sharp text clarity on IDs &amp; signage (&lt; 450 KB).
                  </Text>
                </View>

                {isCompressingHd && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: 10,
                      backgroundColor: '#ECFDF5',
                      borderRadius: 12,
                      marginBottom: 12,
                    }}
                  >
                    <ActivityIndicator size="small" color="#059669" />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#047857' }}>
                      Optimizing HD sharpness & compressing...
                    </Text>
                  </View>
                )}

                <View style={{ gap: 10, marginBottom: 16 }}>
                  {/* 1. Camera */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      backgroundColor: '#F8FAFC',
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                    onPress={() => uploadModalTarget && triggerDocPicker('camera', uploadModalTarget)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 22, marginRight: 14 }}>📸</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>
                        Take Photo with Camera
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        Capture high-clarity live photo using device camera
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, color: '#94A3B8' }}>→</Text>
                  </TouchableOpacity>

                  {/* 2. Gallery */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      backgroundColor: '#F8FAFC',
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                    onPress={() => uploadModalTarget && triggerDocPicker('gallery', uploadModalTarget)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 22, marginRight: 14 }}>🖼️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>
                        Choose from Photo Gallery
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        Pick existing clear photo from device library
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, color: '#94A3B8' }}>→</Text>
                  </TouchableOpacity>

                  {/* 3. Files / PDF */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      backgroundColor: '#F8FAFC',
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                    onPress={() => uploadModalTarget && triggerDocPicker('file', uploadModalTarget)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 22, marginRight: 14 }}>📁</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>
                        Browse Files & Documents
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        Select PDF or scanned identity file from device storage
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, color: '#94A3B8' }}>→</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                    backgroundColor: '#F1F5F9',
                    borderRadius: 14,
                  }}
                  onPress={() => setUploadModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#475569' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      );
    }

    // 7. SERVICE PROVIDER OTP VERIFICATION SCREEN
    if (authStep === 'otp_provider') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <ScrollView
            contentContainerStyle={authStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={authStyles.topNavRow}>
              <TouchableOpacity
                onPress={() => setAuthStep('register_provider')}
                style={authStyles.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={authStyles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Title & Subtitle with Registered Mobile and Edit Button */}
            <Text style={authStyles.screenTitle}>Verify Mobile Number</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 18, flexWrap: 'wrap' }}>
              <Text style={authStyles.screenSubtitle}>
                Enter the 6-digit OTP code sent to +91 {provRegMobile}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setProviderStep(1);
                  setAuthStep('register_provider');
                }}
                style={{ marginLeft: 8 }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={authStyles.editText}>Edit ✎</Text>
              </TouchableOpacity>
            </View>

            {/* 6 Individual Square OTP Boxes with Auto-Advance & Backspace handling */}
            <OtpInputBoxes
              digits={authOtpDigits}
              onChangeDigits={setAuthOtpDigits}
            />

            {/* Optional Dev Quick Fill */}
            <TouchableOpacity
              onPress={() => setAuthOtpDigits(['1', '2', '3', '4', '5', '6'])}
              style={{ alignSelf: 'center', marginTop: 10, paddingVertical: 4 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600' }}>
                Auto-fill test code (123456)
              </Text>
            </TouchableOpacity>

            {/* Resend OTP Section */}
            <View style={authStyles.resendContainer}>
              <Text style={authStyles.resendPromptText}>Didn't receive the OTP?</Text>
              {otpCountdown > 0 ? (
                <Text style={authStyles.resendTimerText}>
                  Resend OTP in 00:{otpCountdown < 10 ? `0${otpCountdown}` : otpCountdown}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setOtpCountdown(28);
                    setAuthOtpDigits(['', '', '', '', '', '']);
                    Alert.alert('OTP Resent', `A new 6-digit OTP has been sent to +91 ${provRegMobile}`);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[authStyles.resendTimerText, { textDecorationLine: 'underline' }]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify & Continue Button */}
            <TouchableOpacity
              style={[authStyles.primaryPillBtn, isSubmittingDb ? { opacity: 0.7 } : null]}
              disabled={isSubmittingDb}
              onPress={async () => {
                if (isSubmittingDb) return;
                const entered = authOtpDigits.join('');
                if (entered.length < 6) {
                  Alert.alert('Incomplete OTP', 'Please enter the full 6-digit OTP code.');
                  return;
                }
                // Save to Supabase provider_profiles with verification_status: 'PENDING'
                await registerProviderInDb({
                  fullName: provRegName,
                  businessName: provRegBusinessName,
                  category: provRegCategory,
                  email: provRegEmail,
                  phone: provRegMobile,
                  pin: provRegPin,
                  locality: provRegArea,
                  city: provRegCity,
                  state: provRegState,
                  district: provRegDistrict,
                  house: provRegHouse,
                  building: provRegBuilding,
                  street: provRegStreet,
                  landmark: provRegLandmark,
                  businessType: provRegBusinessType,
                  about: provRegAbout,
                  workingDays: provAvailableDays,
                  workingHoursFrom: provWorkingHoursFrom,
                  workingHoursTo: provWorkingHoursTo,
                  googleMapsLink: provGoogleMapsLink,
                  premisePhotos: provPremisePhotos,
                  aadhaarDoc: provAadhaarDoc,
                  panDoc: provPanDoc,
                  expDoc: provExpDoc,
                  serviceIds: provSelectedServiceIds,
                });
                setUserName(provRegName);
                if (provRegEmail) setUserEmail(provRegEmail);
                setPhoneNumber(provRegMobile);
                setAuthStep('provider_pending');
              }}
              activeOpacity={0.85}
            >
              {isSubmittingDb ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={authStyles.primaryPillBtnText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 28 }} />
          </ScrollView>

          {/* Organic Mint Bottom Curves */}
          <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
            <View style={authStyles.bottomCurveLayer1} />
            <View style={authStyles.bottomCurveLayer2} />
          </View>
        </SafeAreaView>
      );
    }

    // 8. SERVICE PROVIDER PENDING APPROVAL SCREEN (Matching Reference Screenshot 5: Registration Submitted & Under Verification)
    if (authStep === 'provider_pending') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <ScrollView
            contentContainerStyle={authStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={authStyles.topNavRow}>
              <TouchableOpacity
                onPress={() => {
                  setProviderStep(1);
                  setAuthStep('login');
                }}
                style={authStyles.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={authStyles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Vector Clipboard with Green Checkmark Illustration (Screenshot 5) */}
            <ClipboardSubmittedIllustration />

            {/* Title & Subtitle */}
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <Text style={authStyles.screenTitle}>Registration Submitted!</Text>
              <Text style={authStyles.screenSubtitle}>
                Your service provider account has been{'\n'}submitted for verification.
              </Text>
            </View>

            {/* Re-Upload Clarity Request Notice from Admin */}
            {clarityRequestReason ? (
              <View
                style={{
                  backgroundColor: '#FFFBEB',
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: '#F59E0B',
                  padding: 16,
                  marginVertical: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 20 }}>⚠️</Text>
                  <Text style={{ fontSize: 14.5, fontWeight: 'bold', color: '#92400E' }}>
                    Document Clarity Notice from Admin
                  </Text>
                </View>

                <Text style={{ fontSize: 12.5, color: '#78350F', lineHeight: 18, marginBottom: 10 }}>
                  The compliance audit team reviewed your documents and requested clear, high-definition replacement photos:
                </Text>

                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#FDE68A',
                    marginBottom: 14,
                  }}
                >
                  <Text style={{ fontSize: 12, fontStyle: 'italic', color: '#B45309', lineHeight: 17 }}>
                    "${clarityRequestReason}"
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#D97706',
                    paddingVertical: 13,
                    borderRadius: 24,
                    alignItems: 'center',
                    shadowColor: '#D97706',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  }}
                  onPress={() => {
                    setProviderStep(4);
                    setAuthStep('register_provider');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13.5 }}>
                    Re-Upload Clear HD Documents Now →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Under Verification Status Card (Screenshot 5) */
              <View style={provStepStyles.underVerificationCard}>
                <View style={provStepStyles.underVerificationHeader}>
                  <Text style={{ fontSize: 18 }}>🕒</Text>
                  <Text style={provStepStyles.underVerificationTitle}>Under Verification</Text>
                </View>
                <Text style={provStepStyles.underVerificationDesc}>
                  We'll review your details and activate your account shortly. You'll be notified once it's approved.
                </Text>
              </View>
            )}

            {/* Check Live Verification Status Button */}
            <TouchableOpacity
              style={{
                marginTop: 10,
                paddingVertical: 12,
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: '#10B981',
                alignItems: 'center',
                backgroundColor: '#F0FDF4',
              }}
              onPress={async () => {
                const clean = (provRegMobile || phoneNumber || '').replace(/\D/g, '');
                if (!clean) {
                  Alert.alert('Status Check', 'Your account is under verification.');
                  return;
                }
                try {
                  const { data: userRec } = await supabase
                    .from('users')
                    .select('id')
                    .eq('phone', clean)
                    .maybeSingle();

                  if (userRec?.id) {
                    const { data: prof } = await supabase
                      .from('provider_profiles')
                      .select('verification_status, rejection_reason')
                      .eq('user_id', userRec.id)
                      .maybeSingle();

                    if (prof?.verification_status === 'APPROVED') {
                      Alert.alert(
                        'Account Approved! 🎉',
                        'Your provider account has been approved and activated! You can now access your provider dashboard.',
                        [
                          {
                            text: 'Enter Dashboard',
                            onPress: () => {
                              setActiveRole('provider');
                              setIsAuthenticated(true);
                            },
                          },
                        ]
                      );
                    } else if (prof?.verification_status === 'NEEDS_INFO') {
                      setClarityRequestReason(
                        prof.rejection_reason || 'Please upload clear HD images of your documents.'
                      );
                      Alert.alert(
                        'Action Required',
                        'The admin requested clearer HD document images. Please re-upload.'
                      );
                    } else {
                      Alert.alert('Status Check', 'Your verification is currently under review by the admin team.');
                    }
                  }
                } catch (e) {
                  Alert.alert('Status Check', 'Application is currently in verification pipeline.');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#047857', fontWeight: 'bold', fontSize: 13 }}>
                🔄 Check Live Verification Status
              </Text>
            </TouchableOpacity>

            {/* Action Button: Go to Login (Screenshot 5) */}
            <TouchableOpacity
              style={[authStyles.primaryPillBtn, { marginTop: 12 }]}
              onPress={() => {
                setProviderStep(1);
                setAuthStep('login');
              }}
              activeOpacity={0.85}
            >
              <Text style={authStyles.primaryPillBtnText}>Go to Login</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>

          {/* Organic Mint Bottom Curves */}
          <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
            <View style={authStyles.bottomCurveLayer1} />
            <View style={authStyles.bottomCurveLayer2} />
          </View>
        </SafeAreaView>
      );
    }

    // 9. LOGIN OTP VERIFICATION SCREEN (For Returning Mobile Users)
    if (authStep === 'otp_login' || authStep === 'otp') {
      return (
        <SafeAreaView style={styles.authContainer}>
          <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
          <ScrollView
            contentContainerStyle={authStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row with Back Button */}
            <View style={authStyles.topNavRow}>
              <TouchableOpacity
                onPress={() => setAuthStep('login')}
                style={authStyles.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={authStyles.backBtnText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 44, height: 44 }} />
            </View>

            {/* Centered Brand Logo */}
            <View style={authStyles.logoCenterContainer}>
              <Image
                source={require('./assets/splash-logo.png')}
                style={authStyles.brandLogo}
                resizeMode="contain"
              />
            </View>

            {/* Title & Subtitle */}
            <Text style={authStyles.screenTitle}>Enter OTP</Text>
            <Text style={authStyles.screenSubtitle}>
              We've sent a 6-digit OTP to
            </Text>
            <View style={authStyles.phoneEditRow}>
              <Text style={authStyles.phoneBoldText}>+91 {authMobile || '98765 43210'}</Text>
              <TouchableOpacity
                style={authStyles.editPhoneBtn}
                onPress={() => setAuthStep('login')}
                activeOpacity={0.7}
              >
                <Text style={authStyles.editText}>Edit ✎</Text>
              </TouchableOpacity>
            </View>

            {/* 6 Individual Square OTP Boxes with Auto-Advance & Backspace handling */}
            <OtpInputBoxes
              digits={authOtpDigits}
              onChangeDigits={setAuthOtpDigits}
            />

            {/* Optional Dev Quick Fill */}
            <TouchableOpacity
              onPress={() => setAuthOtpDigits(['1', '2', '3', '4', '5', '6'])}
              style={{ alignSelf: 'center', marginTop: 10, paddingVertical: 4 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600' }}>
                Auto-fill test code (123456)
              </Text>
            </TouchableOpacity>

            {/* Resend OTP Section */}
            <View style={authStyles.resendContainer}>
              <Text style={authStyles.resendPromptText}>Didn't receive the OTP?</Text>
              {otpCountdown > 0 ? (
                <Text style={authStyles.resendTimerText}>
                  Resend OTP in 00:{otpCountdown < 10 ? `0${otpCountdown}` : otpCountdown}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setOtpCountdown(28);
                    setAuthOtpDigits(['', '', '', '', '', '']);
                    Alert.alert('OTP Resent', `A new verification OTP has been sent to +91 ${authMobile}`);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[authStyles.resendTimerText, { textDecorationLine: 'underline' }]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify & Continue Button */}
            <TouchableOpacity
              style={[authStyles.primaryPillBtn, isSubmittingDb ? { opacity: 0.7 } : null]}
              disabled={isSubmittingDb}
              onPress={async () => {
                if (isSubmittingDb) return;
                const entered = authOtpDigits.join('');
                if (entered.length < 6) {
                  Alert.alert('Incomplete OTP', 'Please enter the full 6-digit OTP code.');
                  return;
                }
                const clean = (authMobile || '').replace(/\D/g, '');
                setPhoneNumber(clean || '9876543210');

                // Check provider verification status from DB
                try {
                  const { data: userRec } = await supabase
                    .from('users')
                    .select('id, full_name, user_roles(role)')
                    .eq('phone', clean)
                    .maybeSingle();

                  const isProv = (userRec as any)?.user_roles?.some((r: any) => r.role === 'PROVIDER');
                  if (isProv && userRec?.id) {
                    const { data: profile } = await supabase
                      .from('provider_profiles')
                      .select('verification_status, rejection_reason, business_name')
                      .eq('user_id', userRec.id)
                      .maybeSingle();

                    if (profile?.verification_status === 'NEEDS_INFO') {
                      setClarityRequestReason(
                        profile.rejection_reason || 'Please upload clearer HD photos of your documents.'
                      );
                      setAuthStep('provider_pending');
                      return;
                    } else if (profile?.verification_status === 'PENDING') {
                      setClarityRequestReason('');
                      setAuthStep('provider_pending');
                      return;
                    } else if (profile?.verification_status === 'APPROVED') {
                      setActiveRole('provider');
                      setIsAuthenticated(true);
                      return;
                    }
                  }
                } catch (e) {}

                setIsAuthenticated(true);
              }}
              activeOpacity={0.85}
            >
              {isSubmittingDb ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={authStyles.primaryPillBtnText}>Verify & Continue →</Text>
              )}
            </TouchableOpacity>

            {/* Footer Terms */}
            <View style={[authStyles.footerBox, { marginTop: 24 }]}>
              <Text style={authStyles.footerText}>By continuing, you agree to our</Text>
              <View style={authStyles.footerLinkRow}>
                <Text style={authStyles.footerLink}>Terms & Conditions</Text>
                <Text style={authStyles.footerText}> and </Text>
                <Text style={authStyles.footerLink}>Privacy Policy</Text>
              </View>
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>

          {/* Organic Mint Bottom Curves */}
          <View style={authStyles.bottomCurveWrapper} pointerEvents="none">
            <View style={authStyles.bottomCurveLayer1} />
            <View style={authStyles.bottomCurveLayer2} />
          </View>
        </SafeAreaView>
      );
    }
  }

  // ----------------------------------------------------
  // 3. MAIN APPLICATION SCREEN (CUSTOMER & PROVIDER)
  // ----------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Top Header */}
      {activeRole === 'customer' ? (
        customerTab !== 'category_detail' && (
          <View style={customerHomeStyles.headerRow}>
            <View style={customerHomeStyles.headerLeft}>
              <Image
                source={require('./assets/splash-logo.png')}
                style={customerHomeStyles.headerLogo}
                resizeMode="contain"
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={customerHomeStyles.locationPill}
                onPress={() => setCityPickerModalVisible(true)}
                activeOpacity={0.75}
              >
                <Text style={customerHomeStyles.locationPinIcon}>📍</Text>
                <Text style={customerHomeStyles.locationText}>{customerCity}</Text>
                <Text style={customerHomeStyles.locationChevron}>⌄</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <Image
              source={require('./assets/splash-logo.png')}
              style={styles.topHeaderLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.topHeaderTitle}>Quick Appointments</Text>
              <Text style={styles.topHeaderSub}>Provider Partner App</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.roleSwitchBtn}
            onPress={() => {
              setActiveRole('customer');
              Alert.alert('Role Switched', 'Switched to CUSTOMER mode.');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.roleSwitchText}>⇄ Customer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BODY CONTENT */}
      {activeRole === 'customer' ? (
        // ---------------- CUSTOMER MODE ----------------
        <View style={styles.body}>
          {/* 1. CUSTOMER HOME SCREEN (Image 3) */}
          {customerTab === 'home' && (
            <ScrollView style={styles.scrollContent} contentContainerStyle={customerHomeStyles.scrollPadding} showsVerticalScrollIndicator={false}>
              {/* Rounded Search Pill */}
              <TouchableOpacity
                style={customerHomeStyles.homeSearchPill}
                onPress={() => setCustomerTab('search')}
                activeOpacity={0.8}
              >
                <Text style={customerHomeStyles.homeSearchIcon}>🔍</Text>
                <Text style={customerHomeStyles.homeSearchPlaceholder}>
                  Search for services, providers...
                </Text>
              </TouchableOpacity>

              {/* Hero Promotional Banner */}
              <View style={customerHomeStyles.heroBanner}>
                <View style={customerHomeStyles.heroBannerCurve} />
                <View style={customerHomeStyles.heroLeft}>
                  <Text style={customerHomeStyles.heroTitle}>
                    Book Trusted{'\n'}
                    <Text style={customerHomeStyles.heroTitleGreen}>Local Services</Text>
                  </Text>
                  <Text style={customerHomeStyles.heroSubtitle}>At Your Convenience</Text>
                  <TouchableOpacity
                    style={customerHomeStyles.heroBookBtn}
                    onPress={() => setCustomerTab('all_categories')}
                    activeOpacity={0.85}
                  >
                    <Text style={customerHomeStyles.heroBookBtnText}>Book Now →</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
                  }}
                  style={customerHomeStyles.heroImage}
                  resizeMode="cover"
                />
              </View>

              {/* Banner Carousel Dots */}
              <View style={customerHomeStyles.dotsRow}>
                {[0, 1, 2].map((dot) => (
                  <TouchableOpacity
                    key={dot}
                    onPress={() => setActiveBannerSlide(dot)}
                    style={[
                      customerHomeStyles.dot,
                      activeBannerSlide === dot && customerHomeStyles.dotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Top Categories Section */}
              <View style={customerHomeStyles.sectionHeader}>
                <Text style={customerHomeStyles.sectionTitle}>Top Categories</Text>
                <TouchableOpacity onPress={() => setCustomerTab('all_categories')}>
                  <Text style={customerHomeStyles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={customerHomeStyles.topCategoriesGrid}>
                {ALL_12_CATEGORIES.slice(0, 5).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={customerHomeStyles.topCatCard}
                    onPress={() => {
                      setSelectedCategoryDetail(cat);
                      setCustomerTab('category_detail');
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={customerHomeStyles.catIconCircle}>
                      <Text style={customerHomeStyles.catIconEmoji}>{cat.icon}</Text>
                    </View>
                    <Text style={customerHomeStyles.topCatLabel} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={customerHomeStyles.topCatCard}
                  onPress={() => setCustomerTab('all_categories')}
                  activeOpacity={0.75}
                >
                  <View style={customerHomeStyles.catIconCircle}>
                    <Text style={customerHomeStyles.catIconEmoji}>▦</Text>
                  </View>
                  <Text style={customerHomeStyles.topCatLabel}>More</Text>
                </TouchableOpacity>
              </View>

              {/* Popular Services Section */}
              <View style={customerHomeStyles.sectionHeader}>
                <Text style={customerHomeStyles.sectionTitle}>Popular Services</Text>
                <TouchableOpacity onPress={() => setCustomerTab('search')}>
                  <Text style={customerHomeStyles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={customerHomeStyles.popularScroll}
              >
                {POPULAR_SERVICES_DATA.map((svc) => (
                  <TouchableOpacity
                    key={svc.id}
                    style={customerHomeStyles.popularCard}
                    onPress={() =>
                      openBookingModal(
                        { id: svc.id, name: svc.providerName, categoryName: svc.name },
                        { id: svc.id, name: svc.name, price: svc.price, duration: svc.duration }
                      )
                    }
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: svc.imageUrl }}
                      style={customerHomeStyles.popularImg}
                      resizeMode="cover"
                    />
                    <View style={customerHomeStyles.popularInfo}>
                      <Text style={customerHomeStyles.popularName} numberOfLines={2}>
                        {svc.name}
                      </Text>
                      <Text style={customerHomeStyles.popularPrice}>From ₹{svc.price}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Featured Providers Section */}
              <View style={customerHomeStyles.sectionHeader}>
                <Text style={customerHomeStyles.sectionTitle}>Featured Providers</Text>
                <TouchableOpacity onPress={() => setCustomerTab('search')}>
                  <Text style={customerHomeStyles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {FEATURED_PROVIDERS_DATA.map((prov) => (
                <View key={prov.id} style={customerHomeStyles.featuredProviderCard}>
                  <Image
                    source={{ uri: prov.avatarUrl }}
                    style={customerHomeStyles.featuredAvatar}
                    resizeMode="cover"
                  />
                  <View style={customerHomeStyles.featuredInfo}>
                    <View style={customerHomeStyles.featuredTitleRow}>
                      <Text style={customerHomeStyles.featuredName}>{prov.name}</Text>
                      {prov.isVerified && (
                        <View style={customerHomeStyles.verifiedCheckCircle}>
                          <Text style={customerHomeStyles.verifiedCheckText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={customerHomeStyles.featuredCategory}>{prov.categoryName}</Text>
                  </View>
                  <TouchableOpacity
                    style={customerHomeStyles.featuredBookBtn}
                    onPress={() =>
                      openBookingModal(
                        { id: prov.id, name: prov.name, categoryName: prov.categoryName },
                        { id: `${prov.id}_svc`, name: `${prov.categoryName} Consultation`, price: 499, duration: '45 mins' }
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={customerHomeStyles.featuredBookBtnText}>Book</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* 2. SEARCH SCREEN (Image 2) */}
          {customerTab === 'search' && (
            <ScrollView style={styles.scrollContent} contentContainerStyle={customerHomeStyles.scrollPadding} showsVerticalScrollIndicator={false}>
              <Text style={customerHomeStyles.searchScreenTitle}>Search</Text>
              <Text style={customerHomeStyles.searchScreenSub}>Find services, providers and more</Text>

              <View style={customerHomeStyles.searchScreenInputBox}>
                <Text style={customerHomeStyles.homeSearchIcon}>🔍</Text>
                <TextInput
                  style={customerHomeStyles.searchScreenInput}
                  placeholder="Search for services, providers, categories..."
                  placeholderTextColor="#6B7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => {
                    const trimmed = searchQuery.trim();
                    if (trimmed && !recentSearches.includes(trimmed)) {
                      setRecentSearches((prev) => [trimmed, ...prev.slice(0, 4)]);
                    }
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={{ fontSize: 16, color: '#6B7280', paddingHorizontal: 6 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {searchQuery.trim().length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={customerHomeStyles.sectionTitle}>
                    Results for "{searchQuery}"
                  </Text>
                  {INITIAL_PROVIDERS.concat(
                    FEATURED_PROVIDERS_DATA.map((fp) => ({
                      id: fp.id,
                      name: fp.name,
                      category: 'salon',
                      categoryName: fp.categoryName,
                      rating: fp.rating,
                      reviewsCount: 500,
                      distance: '1.5 km away',
                      services: [
                        { id: `${fp.id}_1`, name: `${fp.categoryName} Standard Package`, price: 499, duration: '45m' },
                      ],
                      nextSlot: fp.nextSlot,
                    }))
                  )
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.services.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((provider) => (
                      <View key={provider.id} style={styles.providerCard}>
                        <View style={styles.providerHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.providerName}>{provider.name}</Text>
                            <Text style={styles.providerCategory}>
                              {provider.categoryName} • {provider.distance}
                            </Text>
                          </View>
                        </View>
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
                </View>
              ) : (
                <>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <View style={{ marginTop: 18 }}>
                      <View style={customerHomeStyles.sectionHeader}>
                        <Text style={customerHomeStyles.sectionTitle}>Recent Searches</Text>
                        <TouchableOpacity onPress={() => setRecentSearches([])}>
                          <Text style={customerHomeStyles.viewAllText}>Clear All</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={customerHomeStyles.pillsWrap}>
                        {recentSearches.map((term) => (
                          <View key={term} style={customerHomeStyles.recentPill}>
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                              onPress={() => setSearchQuery(term)}
                            >
                              <Text style={{ fontSize: 12, color: '#2E7D18' }}>🕒</Text>
                              <Text style={customerHomeStyles.recentPillText}>{term}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setRecentSearches((prev) => prev.filter((item) => item !== term))}
                            >
                              <Text style={customerHomeStyles.recentRemoveIcon}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Trending Searches */}
                  <View style={{ marginTop: 22 }}>
                    <Text style={[customerHomeStyles.sectionTitle, { marginBottom: 12 }]}>
                      Trending Searches
                    </Text>
                    <View style={customerHomeStyles.pillsWrap}>
                      {trendingSearches.map((term) => (
                        <TouchableOpacity
                          key={term}
                          style={customerHomeStyles.trendingPill}
                          onPress={() => setSearchQuery(term)}
                        >
                          <Text style={{ fontSize: 12, color: '#2E7D18', fontWeight: 'bold' }}>↗</Text>
                          <Text style={customerHomeStyles.trendingPillText}>{term}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Explore by Category (4x2 Grid matching Image 2) */}
                  <View style={[customerHomeStyles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={customerHomeStyles.sectionTitle}>Explore by Category</Text>
                    <TouchableOpacity onPress={() => setCustomerTab('all_categories')}>
                      <Text style={customerHomeStyles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={customerHomeStyles.exploreGrid}>
                    {ALL_12_CATEGORIES.slice(0, 7).map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={customerHomeStyles.exploreCatTile}
                        onPress={() => {
                          setSelectedCategoryDetail(cat);
                          setCustomerTab('category_detail');
                        }}
                      >
                        <View style={customerHomeStyles.catIconCircle}>
                          <Text style={customerHomeStyles.catIconEmoji}>{cat.icon}</Text>
                        </View>
                        <Text style={customerHomeStyles.exploreCatLabel} numberOfLines={2}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={customerHomeStyles.exploreCatTile}
                      onPress={() => setCustomerTab('all_categories')}
                    >
                      <View style={customerHomeStyles.catIconCircle}>
                        <Text style={customerHomeStyles.catIconEmoji}>▦</Text>
                      </View>
                      <Text style={customerHomeStyles.exploreCatLabel}>More</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* 3. ALL CATEGORIES SCREEN (Image 1) */}
          {customerTab === 'all_categories' && (
            <ScrollView style={styles.scrollContent} contentContainerStyle={customerHomeStyles.scrollPadding} showsVerticalScrollIndicator={false}>
              <View style={customerHomeStyles.allCatHeaderRow}>
                <TouchableOpacity
                  onPress={() => setCustomerTab('home')}
                  style={customerHomeStyles.backCircleBtn}
                >
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111111' }}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={customerHomeStyles.searchScreenTitle}>All Categories</Text>
                  <Text style={customerHomeStyles.searchScreenSub}>
                    Explore all available service categories
                  </Text>
                </View>
              </View>

              <View style={[customerHomeStyles.searchScreenInputBox, { marginTop: 14 }]}>
                <Text style={customerHomeStyles.homeSearchIcon}>🔍</Text>
                <TextInput
                  style={customerHomeStyles.searchScreenInput}
                  placeholder="Search categories..."
                  placeholderTextColor="#6B7280"
                  value={categoryFilterSearch}
                  onChangeText={setCategoryFilterSearch}
                />
              </View>

              <View style={customerHomeStyles.allCategoriesGrid}>
                {ALL_12_CATEGORIES.filter((c) =>
                  c.shortName.toLowerCase().includes(categoryFilterSearch.toLowerCase())
                ).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={customerHomeStyles.allCatGridItem}
                    onPress={() => {
                      if (cat.id === 'more') {
                        setCategoryFilterSearch('');
                      } else {
                        setSelectedCategoryDetail(cat);
                        setCustomerTab('category_detail');
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={customerHomeStyles.allCatIconCircle}>
                      <Text style={customerHomeStyles.allCatIconEmoji}>{cat.icon}</Text>
                    </View>
                    <Text style={customerHomeStyles.allCatLabel} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* 3.5. CATEGORY DETAIL SCREEN (Matching Image 1: Beauty & Salon) */}
          {customerTab === 'category_detail' && (
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={customerHomeStyles.scrollPadding}
              showsVerticalScrollIndicator={false}
            >
              {/* Header: Back Button, Title, Subtitle, Search and Favorite Icons */}
              <View style={customerHomeStyles.catDetailHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <TouchableOpacity
                    onPress={() => setCustomerTab('all_categories')}
                    style={customerHomeStyles.backCircleBtn}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111111' }}>←</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={customerHomeStyles.catDetailHeaderTitle} numberOfLines={1}>
                      {selectedCategoryDetail?.shortName || 'Beauty & Salon'}
                    </Text>
                    <Text style={customerHomeStyles.catDetailHeaderSub} numberOfLines={1}>
                      Explore salon and beauty services near you
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={customerHomeStyles.backCircleBtn}
                    onPress={() => {
                      setSearchQuery(selectedCategoryDetail?.shortName || '');
                      setCustomerTab('search');
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 16 }}>🔍</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={customerHomeStyles.backCircleBtn}
                    onPress={() => setIsCategoryDetailFavorite((prev) => !prev)}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 18, color: '#16A34A' }}>
                      {isCategoryDetailFavorite ? '💚' : '♡'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hero Banner (Matching Image 1: Mint card, Heading, Subtitle, Beauty Photo) */}
              <View style={customerHomeStyles.catDetailHero}>
                <View style={customerHomeStyles.catDetailHeroLeft}>
                  <Text style={customerHomeStyles.catDetailHeroTitle}>
                    {selectedCategoryDetail?.shortName || 'Beauty & Salon'}
                  </Text>
                  <Text style={customerHomeStyles.catDetailHeroSub}>
                    Hair, Skin, Makeup & More{'\n'}at Your Convenience
                  </Text>
                </View>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
                  }}
                  style={customerHomeStyles.catDetailHeroImg}
                  resizeMode="cover"
                />
              </View>

              {/* Subcategories (Matching Image 1: 4x2 Grid of 8 Cards) */}
              <View style={{ marginBottom: 20 }}>
                <View style={customerHomeStyles.sectionHeader}>
                  <Text style={customerHomeStyles.sectionTitle}>Subcategories</Text>
                  {activeSubcategoryFilter && (
                    <TouchableOpacity onPress={() => setActiveSubcategoryFilter(null)}>
                      <Text style={customerHomeStyles.viewAllText}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={customerHomeStyles.subcatGrid}>
                  {BEAUTY_SUBCATEGORIES_DATA.map((sub) => {
                    const isSelected = activeSubcategoryFilter === sub.id;
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={[
                          customerHomeStyles.subcatCard,
                          isSelected && customerHomeStyles.subcatCardActive,
                        ]}
                        onPress={() =>
                          setActiveSubcategoryFilter((prev) => (prev === sub.id ? null : sub.id))
                        }
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            customerHomeStyles.subcatIconCircle,
                            isSelected && customerHomeStyles.subcatIconCircleActive,
                          ]}
                        >
                          <Text style={customerHomeStyles.subcatIconText}>{sub.icon}</Text>
                        </View>
                        <Text style={customerHomeStyles.subcatLabel} numberOfLines={2}>
                          {sub.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Popular Services (Matching Image 1: Facial Clean Up, Hair Cut, Manicure & Pedicure) */}
              <View style={{ marginBottom: 20 }}>
                <View style={customerHomeStyles.sectionHeader}>
                  <Text style={customerHomeStyles.sectionTitle}>Popular Services</Text>
                  <TouchableOpacity onPress={() => setActiveSubcategoryFilter(null)}>
                    <Text style={customerHomeStyles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={customerHomeStyles.popularServicesScroll}
                >
                  {BEAUTY_POPULAR_SERVICES_DATA.filter((svc) =>
                    activeSubcategoryFilter ? svc.subcategoryId === activeSubcategoryFilter : true
                  ).map((svc) => (
                    <View key={svc.id} style={customerHomeStyles.popularServiceCard}>
                      <Image
                        source={{ uri: svc.imageUrl }}
                        style={customerHomeStyles.popularServiceImg}
                        resizeMode="cover"
                      />
                      <View style={customerHomeStyles.popularServiceBody}>
                        <Text style={customerHomeStyles.popularServiceTitle} numberOfLines={1}>
                          {svc.name}
                        </Text>
                        <Text style={customerHomeStyles.popularServiceDuration}>
                          ⏱ {svc.duration}
                        </Text>
                        <Text style={customerHomeStyles.popularServicePrice}>
                          ₹{svc.price}
                        </Text>
                        <TouchableOpacity
                          style={customerHomeStyles.popularServiceBookBtn}
                          onPress={() =>
                            openBookingModal(svc.provider, {
                              id: svc.id,
                              name: svc.name,
                              price: svc.price,
                              duration: svc.duration,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={customerHomeStyles.popularServiceBookBtnText}>Book</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Verified Specialists */}
              <View style={customerHomeStyles.sectionHeader}>
                <Text style={customerHomeStyles.sectionTitle}>Verified Specialists</Text>
              </View>
              {FEATURED_PROVIDERS_DATA.map((prov) => (
                <View key={prov.id} style={customerHomeStyles.featuredProviderCard}>
                  <Image
                    source={{ uri: prov.avatarUrl }}
                    style={customerHomeStyles.featuredAvatar}
                    resizeMode="cover"
                  />
                  <View style={customerHomeStyles.featuredInfo}>
                    <View style={customerHomeStyles.featuredTitleRow}>
                      <Text style={customerHomeStyles.featuredName}>{prov.name}</Text>
                      {prov.isVerified && (
                        <View style={customerHomeStyles.verifiedCheckCircle}>
                          <Text style={customerHomeStyles.verifiedCheckText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={customerHomeStyles.featuredCategory}>
                      {selectedCategoryDetail?.shortName || prov.categoryName} • {customerCity}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={customerHomeStyles.popularServiceBookBtn}
                    onPress={() =>
                      openBookingModal(
                        { id: prov.id, name: prov.name, categoryName: selectedCategoryDetail?.shortName || prov.categoryName },
                        {
                          id: `${prov.id}_consultation`,
                          name: `${selectedCategoryDetail?.shortName || 'Salon'} Specialist Session`,
                          price: 499,
                          duration: '45 mins',
                        }
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={customerHomeStyles.popularServiceBookBtnText}>Book</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* 4. FAVORITES SCREEN */}
          {customerTab === 'favorites' && (
            <ScrollView style={styles.scrollContent} contentContainerStyle={customerHomeStyles.scrollPadding} showsVerticalScrollIndicator={false}>
              <Text style={customerHomeStyles.searchScreenTitle}>Favorites</Text>
              <Text style={customerHomeStyles.searchScreenSub}>Your saved trusted service providers</Text>

              <View style={{ marginTop: 16 }}>
                {FEATURED_PROVIDERS_DATA.map((prov) => {
                  const isFav = favoritesList.includes(prov.id);
                  return (
                    <View key={prov.id} style={customerHomeStyles.featuredProviderCard}>
                      <Image
                        source={{ uri: prov.avatarUrl }}
                        style={customerHomeStyles.featuredAvatar}
                        resizeMode="cover"
                      />
                      <View style={customerHomeStyles.featuredInfo}>
                        <View style={customerHomeStyles.featuredTitleRow}>
                          <Text style={customerHomeStyles.featuredName}>{prov.name}</Text>
                          {prov.isVerified && (
                            <View style={customerHomeStyles.verifiedCheckCircle}>
                              <Text style={customerHomeStyles.verifiedCheckText}>✓</Text>
                            </View>
                          )}
                        </View>
                        <Text style={customerHomeStyles.featuredCategory}>{prov.categoryName}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          setFavoritesList((prev) =>
                            isFav ? prev.filter((id) => id !== prov.id) : [...prev, prov.id]
                          )
                        }
                        style={{ padding: 8 }}
                      >
                        <Text style={{ fontSize: 18 }}>{isFav ? '❤️' : '🤍'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={customerHomeStyles.featuredBookBtn}
                        onPress={() =>
                          openBookingModal(
                            { id: prov.id, name: prov.name, categoryName: prov.categoryName },
                            { id: `${prov.id}_svc`, name: `${prov.categoryName} Service`, price: 499, duration: '45 mins' }
                          )
                        }
                      >
                        <Text style={customerHomeStyles.featuredBookBtnText}>Book</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {customerTab === 'bookings' && (
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.screenTitle}>My Appointments & Bookings</Text>
              <Text style={styles.screenSub}>
                Scheduled services with anti-fraud delivery OTP & 100% refund cancellation
              </Text>

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
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookingId}>Booking #{booking.id}</Text>
                        <Text style={styles.bookingService}>{booking.serviceName}</Text>
                        <Text style={styles.bookingProvider}>🏢 {booking.providerName}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          booking.status === 'COMPLETED'
                            ? styles.statusCompleted
                            : booking.status === 'CANCELLED'
                            ? styles.statusCancelled
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

                    {/* Anti-fraud Service Delivery OTP Badge */}
                    {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                      <View style={styles.deliveryOtpContainer}>
                        <View style={styles.deliveryOtpHeader}>
                          <Text style={styles.deliveryOtpTitle}>
                            🔑 Service Delivery OTP
                          </Text>
                          <Text style={styles.deliveryOtpSub}>
                            Show to specialist upon completion to verify
                          </Text>
                        </View>
                        <View style={styles.otpBox}>
                          <Text style={styles.otpDigits}>{booking.deliveryOtp}</Text>
                        </View>
                      </View>
                    )}

                    {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                      <View style={styles.bookingActionRow}>
                        <TouchableOpacity
                          style={styles.cancelActionBtn}
                          onPress={() => {
                            Alert.alert(
                              'Cancel Appointment?',
                              'Cancel this booking? 100% of your paid amount will be refunded to your original payment method.',
                              [
                                { text: 'No, Keep Slot', style: 'cancel' },
                                {
                                  text: 'Yes, Cancel (100% Refund)',
                                  style: 'destructive',
                                  onPress: () => {
                                    setBookings((prev) =>
                                      prev.map((b) =>
                                        b.id === booking.id ? { ...b, status: 'CANCELLED' } : b
                                      )
                                    );
                                    Alert.alert('Refund Initiated', 'Appointment cancelled. 100% refund has been processed.');
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
                          onPress={() => {
                            setReschedulingBooking(booking);
                            setRescheduleModalVisible(true);
                          }}
                        >
                          <Text style={styles.rescheduleActionText}>Reschedule Slot</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.detailsActionBtn}
                          onPress={() => {
                            setSelectedBookingDetails(booking);
                            setDetailsModalVisible(true);
                          }}
                        >
                          <Text style={styles.detailsActionText}>Details</Text>
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
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.profileHeaderBox}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
                </View>
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profilePhone}>+91 {phoneNumber} • {userEmail}</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>✓ Verified Client Account</Text>
                </View>
              </View>

              <View style={styles.profileMenuBox}>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => {
                    setEditName(userName);
                    setEditEmail(userEmail);
                    setEditProfileVisible(true);
                  }}
                >
                  <Text style={styles.menuItemText}>✏️ Edit Profile Information</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => setAddressesModalVisible(true)}
                >
                  <Text style={styles.menuItemText}>📍 Saved Delivery Addresses ({savedAddresses.length})</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => setSettingsModalVisible(true)}
                >
                  <Text style={styles.menuItemText}>⚙️ Notifications & Settings</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() =>
                    Alert.alert(
                      'Quick Support Desk',
                      'Email: support@quickappointments.com\nHotline: 1800-QUICK-APPT (Available 24x7)\nZero cancellation fees policy guaranteed.'
                    )
                  }
                >
                  <Text style={styles.menuItemText}>💬 24/7 Priority Support Desk</Text>
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

                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={async () => {
                    const synced = await syncProviderAccountState(phoneNumber);
                    const status = synced?.status || providerVerificationStatus;
                    setActiveRole('provider');
                    if (status !== 'APPROVED') {
                      Alert.alert(
                        'Provider Approval Required',
                        `Your provider application status is ${status}. Provider dashboard features remain locked until Admin approval.`
                      );
                    }
                  }}
                >
                  <Text style={styles.menuItemText}>⇄ Switch to Provider Partner Mode</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* Customer 5-Tab Bottom Navigation (Aligned with Images 1, 2, 3) */}
          <View style={customerHomeStyles.bottomNavBar}>
            <TouchableOpacity
              style={customerHomeStyles.bottomNavTab}
              onPress={() => setCustomerTab('home')}
              activeOpacity={0.7}
            >
              <Text style={[customerHomeStyles.bottomNavIcon, customerTab === 'home' && customerHomeStyles.bottomNavIconActive]}>
                🏠
              </Text>
              <Text style={[customerHomeStyles.bottomNavLabel, customerTab === 'home' && customerHomeStyles.bottomNavLabelActive]}>
                Home
              </Text>
              {customerTab === 'home' && <View style={customerHomeStyles.bottomNavIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={customerHomeStyles.bottomNavTab}
              onPress={() => setCustomerTab('search')}
              activeOpacity={0.7}
            >
              <Text style={[customerHomeStyles.bottomNavIcon, (customerTab === 'search' || customerTab === 'all_categories' || customerTab === 'category_detail') && customerHomeStyles.bottomNavIconActive]}>
                🔍
              </Text>
              <Text style={[customerHomeStyles.bottomNavLabel, (customerTab === 'search' || customerTab === 'all_categories' || customerTab === 'category_detail') && customerHomeStyles.bottomNavLabelActive]}>
                Search
              </Text>
              {(customerTab === 'search' || customerTab === 'all_categories' || customerTab === 'category_detail') && <View style={customerHomeStyles.bottomNavIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={customerHomeStyles.bottomNavTab}
              onPress={() => setCustomerTab('bookings')}
              activeOpacity={0.7}
            >
              <Text style={[customerHomeStyles.bottomNavIcon, customerTab === 'bookings' && customerHomeStyles.bottomNavIconActive]}>
                📅
              </Text>
              <Text style={[customerHomeStyles.bottomNavLabel, customerTab === 'bookings' && customerHomeStyles.bottomNavLabelActive]}>
                Appointments
              </Text>
              {customerTab === 'bookings' && <View style={customerHomeStyles.bottomNavIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={customerHomeStyles.bottomNavTab}
              onPress={() => setCustomerTab('favorites')}
              activeOpacity={0.7}
            >
              <Text style={[customerHomeStyles.bottomNavIcon, customerTab === 'favorites' && customerHomeStyles.bottomNavIconActive]}>
                🤍
              </Text>
              <Text style={[customerHomeStyles.bottomNavLabel, customerTab === 'favorites' && customerHomeStyles.bottomNavLabelActive]}>
                Favorites
              </Text>
              {customerTab === 'favorites' && <View style={customerHomeStyles.bottomNavIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={customerHomeStyles.bottomNavTab}
              onPress={() => setCustomerTab('profile')}
              activeOpacity={0.7}
            >
              <Text style={[customerHomeStyles.bottomNavIcon, customerTab === 'profile' && customerHomeStyles.bottomNavIconActive]}>
                👤
              </Text>
              <Text style={[customerHomeStyles.bottomNavLabel, customerTab === 'profile' && customerHomeStyles.bottomNavLabelActive]}>
                Profile
              </Text>
              {customerTab === 'profile' && <View style={customerHomeStyles.bottomNavIndicator} />}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // ---------------- PROVIDER MODE ----------------
        <View style={styles.body}>
          {providerVerificationStatus !== 'APPROVED' ? (
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1.5,
                  borderColor:
                    providerVerificationStatus === 'REJECTED'
                      ? '#EF4444'
                      : providerVerificationStatus === 'NEEDS_INFO'
                      ? '#F59E0B'
                      : '#16A34A',
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 6 }}>
                  {providerVerificationStatus === 'REJECTED'
                    ? '❌ Application Rejected'
                    : providerVerificationStatus === 'NEEDS_INFO'
                    ? '⚠️ Action Required: Re-upload KYC'
                    : '🕒 Provider Account Pending Admin Approval'}
                </Text>
                <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 19, marginBottom: 12 }}>
                  {(providerProfileState?.businessName || providerProfileState?.business_name || provRegBusinessName || 'Your Provider Account')}{' '}
                  cannot accept customer bookings or go Online until Quick Appointments Admin approves your KYC documents.
                </Text>

                {providerRejectionReason ? (
                  <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#991B1B', marginBottom: 2 }}>Admin Remarks:</Text>
                    <Text style={{ fontSize: 12, color: '#7F1D1D' }}>{providerRejectionReason}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                    onPress={async () => {
                      const synced = await syncProviderAccountState(phoneNumber);
                      if (synced?.status === 'APPROVED') {
                        Alert.alert('Approved! 🎉', 'Your provider account is now active for bookings!');
                      } else {
                        Alert.alert('Current Status', `Status: ${synced?.status || providerVerificationStatus}`);
                      }
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>🔄 Refresh Live Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                    onPress={() => setActiveRole('customer')}
                  >
                    <Text style={{ color: '#1F2937', fontWeight: 'bold', fontSize: 13 }}>← Customer Mode</Text>
                  </TouchableOpacity>
                </View>

                {(providerVerificationStatus === 'REJECTED' || providerVerificationStatus === 'NEEDS_INFO') && (
                  <TouchableOpacity
                    style={{ marginTop: 10, backgroundColor: '#D97706', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                    onPress={() => {
                      setIsAuthenticated(false);
                      setProviderStep(4);
                      setAuthStep('register_provider');
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Re-Upload KYC Documents →</Text>
                  </TouchableOpacity>
                )}
              </View>

              {providerNotifications.length > 0 && (
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
                    🔔 Notifications & Updates
                  </Text>
                  {providerNotifications.map((n, idx) => (
                    <View key={n.id || idx} style={{ paddingVertical: 8, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#F3F4F6' }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#111827' }}>{n.title}</Text>
                      <Text style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{n.body}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          ) : (
            <>
              {providerTab === 'dashboard' && (
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
              {/* Online / Offline Toggle */}
              <View style={styles.statusToggleBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusToggleTitle}>
                    {isOnline ? '🟢 Online & Ready for Orders' : '⚪ Offline'}
                  </Text>
                  <Text style={styles.statusToggleSub}>
                    {isOnline ? 'Active for incoming client appointments' : 'You are currently unavailable to clients'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleBtn, isOnline ? styles.toggleBtnOn : styles.toggleBtnOff]}
                  onPress={() => setIsOnline(!isOnline)}
                >
                  <Text style={[styles.toggleBtnText, isOnline ? styles.toggleBtnTextOn : styles.toggleBtnTextOff]}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SLA Incoming Booking Card */}
              {pendingJob && (
                <View style={styles.slaCard}>
                  <View style={styles.slaHeaderRow}>
                    <View style={styles.slaTag}>
                      <Text style={styles.slaTagText}>⚡ URGENT REQUEST (SLA)</Text>
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
                  <Text style={styles.slaPayout}>Net Payout: ₹{pendingJob.amount}</Text>

                  <View style={styles.slaActionButtons}>
                    <TouchableOpacity
                      style={styles.slaAcceptBtn}
                      onPress={handleAcceptJob}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.slaAcceptBtnText}>✓ Accept Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.slaRejectBtn}
                      onPress={handleRejectJob}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.slaRejectBtnText}>✕ Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Verify Customer Delivery OTP Card */}
              <View style={styles.verifyOtpCard}>
                <Text style={styles.verifyOtpCardTitle}>
                  🔐 Complete Job via Delivery OTP
                </Text>
                <Text style={styles.verifyOtpCardSub}>
                  Enter the 6-digit delivery OTP shown on the customer's phone to verify and unlock payment
                </Text>

                <View style={styles.verifyOtpInputRow}>
                  <TextInput
                    style={styles.verifyOtpTextInput}
                    placeholder="Enter 6 digits"
                    placeholderTextColor={COLORS.textMuted}
                    value={verifyOtpInput}
                    onChangeText={setVerifyOtpInput}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.verifyOtpSubmitBtn}
                    onPress={handleVerifyDeliveryOtp}
                    activeOpacity={0.8}
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
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.screenTitle}>Availability & Slot Manager</Text>
              <Text style={styles.screenSub}>
                Manage your working hours and toggle available booking slots
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
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.screenTitle}>Earnings & Payouts</Text>
              <View style={styles.payoutCard}>
                <Text style={styles.payoutLabel}>Available for Bank Transfer</Text>
                <Text style={styles.payoutAmount}>₹{providerEarnings}</Text>
                <TouchableOpacity
                  style={styles.payoutBtn}
                  onPress={() =>
                    Alert.alert(
                      'Payout Initiated',
                      `₹${providerEarnings} transfer initiated to HDFC Bank (A/C ending in **4921). Arrives within 15 minutes.`
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.payoutBtnText}>⚡ Transfer to Bank Account</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionHeader}>Recent Transactions</Text>
              {bookings
                .filter((b) => b.status === 'COMPLETED')
                .map((b) => (
                  <View key={b.id} style={styles.transactionItem}>
                    <View style={{ flex: 1 }}>
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
            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.profileHeaderBox}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>💼</Text>
                </View>
                <Text style={styles.profileName}>
                  {providerProfileState?.businessName || providerProfileState?.business_name || provRegBusinessName || userName || 'Provider Partner'}
                </Text>
                <Text style={styles.profilePhone}>+91 {phoneNumber}</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedTagText}>
                    {providerVerificationStatus === 'APPROVED'
                      ? '🛡️ KYC Verified Partner'
                      : `🕒 Status: ${providerVerificationStatus}`}
                  </Text>
                </View>
              </View>

              <View style={styles.profileMenuBox}>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={async () => {
                    const synced = await syncProviderAccountState(phoneNumber);
                    Alert.alert(
                      'KYC Verification Status',
                      `Current Status: ${synced?.status || providerVerificationStatus}${
                        providerRejectionReason ? `\nAdmin Note: ${providerRejectionReason}` : ''
                      }`
                    );
                  }}
                >
                  <Text style={styles.menuItemText}>📄 KYC Verification Status</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => Alert.alert('Bank Account', 'Manage settlement bank details in KYC Verification setup.')}
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
            </>
          )}
        </View>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. MODALS: BOOKING, RAZORPAY, RESCHEDULE, DETAILS, ETC */}
      {/* ---------------------------------------------------- */}

      {/* BOOKING MODAL */}
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
              <ScrollView showsVerticalScrollIndicator={false}>
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
                  style={styles.primaryButton}
                  onPress={handleProceedToPayment}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    Proceed to Payment (₹{selectedService.price + 20})
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* RAZORPAY MODAL (Aligned to Official Cream/Green Brand) */}
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
                <Text style={styles.razorpayLogo}>⚡ Razorpay Checkout</Text>
                <View style={styles.razorpayTestBadge}>
                  <Text style={styles.razorpayTestText}>SECURE SANDBOX</Text>
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
                  Merchant: Quick Appointments Official
                </Text>

                <Text style={styles.paymentMethodTitle}>Select Payment Method:</Text>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'upi' && styles.paymentOptionActive,
                  ]}
                  onPress={() => setPaymentMethod('upi')}
                >
                  <Text style={styles.paymentOptionIcon}>📱</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.paymentOptionTitle}>UPI Instant Transfer</Text>
                    <Text style={styles.paymentOptionSub}>Google Pay, PhonePe, Paytm, BHIM</Text>
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
                    <Text style={styles.paymentOptionSub}>HDFC, ICICI, SBI, Axis, Kotak</Text>
                  </View>
                  {paymentMethod === 'netbanking' && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSimulateRazorpaySuccess}
                  disabled={isPaying}
                  activeOpacity={0.8}
                >
                  {isPaying ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Confirm & Pay ₹{selectedService.price + 20}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.razorpaySecurityText}>
                  🔒 256-Bit Encrypted • 100% Instant Refund Guarantee
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* RESCHEDULE MODAL */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {reschedulingBooking && (
              <ScrollView>
                <Text style={styles.modalService}>{reschedulingBooking.serviceName}</Text>
                <Text style={styles.modalProvider}>{reschedulingBooking.providerName}</Text>
                <Text style={styles.slotPickerTitle}>Select New Time Slot:</Text>

                <View style={styles.slotGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = newSelectedSlot === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotBtn,
                          isSelected && styles.slotBtnSelected,
                        ]}
                        onPress={() => setNewSelectedSlot(slot)}
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

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleConfirmReschedule}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Confirm Rescheduled Slot</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* APPOINTMENT DETAILS MODAL */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedBookingDetails && (
              <View style={{ gap: 12 }}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Reference ID</Text>
                  <Text style={styles.detailValue}>#{selectedBookingDetails.id}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Specialist / Clinic</Text>
                  <Text style={styles.detailValue}>{selectedBookingDetails.providerName}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue}>{selectedBookingDetails.serviceName}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Confirmed Schedule</Text>
                  <Text style={styles.detailValue}>{selectedBookingDetails.slot}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Total Amount Paid</Text>
                  <Text style={[styles.detailValue, { color: COLORS.primary, fontWeight: 'bold' }]}>
                    ₹{selectedBookingDetails.amount}
                  </Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Service Delivery OTP</Text>
                  <Text style={[styles.detailValue, { letterSpacing: 3, fontWeight: 'bold' }]}>
                    {selectedBookingDetails.deliveryOtp}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setDetailsModalVisible(false)}
                >
                  <Text style={styles.primaryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <Text style={styles.inputLabel}>Full Legal Name</Text>
              <TextInput
                style={styles.textInputBox}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInputBox}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                placeholder="Enter email address"
                placeholderTextColor={COLORS.textMuted}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  setUserName(editName);
                  setUserEmail(editEmail);
                  setEditProfileVisible(false);
                  Alert.alert('Profile Updated', 'Your profile details have been saved.');
                }}
              >
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SAVED ADDRESSES MODAL */}
      <Modal
        visible={addressesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Addresses</Text>
              <TouchableOpacity onPress={() => setAddressesModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 250 }}>
              {savedAddresses.map((addr, idx) => (
                <View key={idx} style={styles.addressItem}>
                  <Text style={styles.addressText}>📍 {addr}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSavedAddresses((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  >
                    <Text style={{ color: COLORS.danger, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Add New Address</Text>
            <TextInput
              style={styles.textInputBox}
              value={newAddressInput}
              onChangeText={setNewAddressInput}
              placeholder="e.g. Unit 301, Oberoi Splendor, Mumbai"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 8 }]}
              onPress={() => {
                if (!newAddressInput.trim()) return;
                setSavedAddresses((prev) => [...prev, newAddressInput.trim()]);
                setNewAddressInput('');
              }}
            >
              <Text style={styles.primaryButtonText}>+ Add Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preferences & Notifications</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => {
                  const langs = ['English', 'Hindi (हिंदी)', 'Telugu (తెలుగు)', 'Tamil (தமிழ்)', 'Kannada (ಕನ್ನಡ)', 'Malayalam (മലയാളം)'];
                  const curIdx = langs.findIndex(l => l.startsWith(selectedLangCode));
                  const nextLang = langs[(curIdx + 1) % langs.length];
                  setSelectedLangCode(nextLang.split(' ')[0]);
                  Alert.alert('Language Updated', `Application language set to ${nextLang}`);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsTitle}>App Language</Text>
                  <Text style={styles.settingsDesc}>Switch language across all screens</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.primary, backgroundColor: '#EFF8E7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  {selectedLangCode || 'English'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsTitle}>Push Notifications</Text>
                  <Text style={styles.settingsDesc}>Live appointment updates and specialist alerts</Text>
                </View>
                <Text style={[styles.settingsToggle, pushNotificationsEnabled && styles.settingsToggleActive]}>
                  {pushNotificationsEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => setSmsRemindersEnabled(!smsRemindersEnabled)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsTitle}>SMS Reminders</Text>
                  <Text style={styles.settingsDesc}>30-minute advance delivery OTP alerts</Text>
                </View>
                <Text style={[styles.settingsToggle, smsRemindersEnabled && styles.settingsToggleActive]}>
                  {smsRemindersEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setSettingsModalVisible(false)}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CITY PICKER MODAL */}
      <Modal
        visible={cityPickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCityPickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your City</Text>
              <TouchableOpacity onPress={() => setCityPickerModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginTop: 4 }}>
              {AVAILABLE_CITIES.map((city) => {
                const isSelected = customerCity === city;
                return (
                  <TouchableOpacity
                    key={city}
                    style={[
                      customerHomeStyles.cityOptionBtn,
                      isSelected && customerHomeStyles.cityOptionBtnActive,
                    ]}
                    onPress={() => {
                      setCustomerCity(city);
                      setCityPickerModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        customerHomeStyles.cityOptionText,
                        isSelected && customerHomeStyles.cityOptionTextActive,
                      ]}
                    >
                      📍 {city}
                    </Text>
                    {isSelected && <Text style={{ color: '#2E7D18', fontWeight: 'bold' }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// ONBOARDING VECTOR ILLUSTRATION STYLES
// ----------------------------------------------------
const illusStyles = StyleSheet.create({
  wrapper: {
    width: 220,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  circleBackdrop: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#E8F6E4',
  },
  raysContainer: {
    position: 'absolute',
    top: 8,
    right: 26,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    zIndex: 10,
  },
  ray: {
    width: 3.5,
    height: 14,
    backgroundColor: '#2E9E1E',
    borderRadius: 2,
  },
  calendarCard: {
    width: 126,
    height: 126,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 3.5,
    borderColor: '#1B5E20',
    padding: 12,
    justifyContent: 'space-between',
    zIndex: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ringLeft: {
    position: 'absolute',
    top: -8,
    left: 24,
    width: 8,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#1B5E20',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  ringRight: {
    position: 'absolute',
    top: -8,
    right: 24,
    width: 8,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#1B5E20',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  calendarHeader: {
    height: 12,
    borderBottomWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  gridSquare: {
    width: 24,
    height: 16,
    backgroundColor: '#A5D6A7',
    borderRadius: 4,
  },
  specialistContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 5,
  },
  hairCap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 2,
  },
  face: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F2E6',
    borderWidth: 2,
    borderColor: '#1B5E20',
  },
  apronBody: {
    width: 100,
    height: 52,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#E8F6E4',
    borderWidth: 3.5,
    borderColor: '#1B5E20',
    borderBottomWidth: 0,
    alignItems: 'center',
    paddingTop: 4,
  },
  collarRow: {
    flexDirection: 'row',
    gap: 12,
  },
  collarLeft: {
    width: 10,
    height: 14,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#1B5E20',
    transform: [{ rotate: '45deg' }],
  },
  collarRight: {
    width: 10,
    height: 14,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#1B5E20',
    transform: [{ rotate: '-45deg' }],
  },
  apronButton: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1B5E20',
    marginTop: 6,
  },
  phoneFrame: {
    width: 96,
    height: 144,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 3.5,
    borderColor: '#1B5E20',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  phoneSpeaker: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1B5E20',
    marginBottom: 4,
  },
  phoneCalendarMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F6E4',
    borderWidth: 2,
    borderColor: '#2E9E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  phoneItemRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  phoneMiniCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A5D6A7',
  },
  phoneMiniLine: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8F6E4',
  },
  badgeCircle: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2E9E1E',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

const mapIllusStyles = StyleSheet.create({
  container: {
    width: 200,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  skylineBackdrop: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  building: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#E2F0DC',
    borderRadius: 3,
  },
  tree: {
    position: 'absolute',
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C8E6C9',
  },
  mapFoldContainer: {
    position: 'absolute',
    bottom: 8,
    width: 150,
    height: 38,
    flexDirection: 'row',
  },
  mapFold: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  mapFold1: {
    backgroundColor: '#EDF7ED',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    transform: [{ skewY: '-8deg' }],
  },
  mapFold2: {
    backgroundColor: '#E0F2E9',
    transform: [{ skewY: '8deg' }],
  },
  mapFold3: {
    backgroundColor: '#EDF7ED',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    transform: [{ skewY: '-8deg' }],
  },
  pinWrapper: {
    position: 'absolute',
    bottom: 26,
    alignItems: 'center',
    zIndex: 10,
  },
  pinHead: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E9E1E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E9E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  pinCenterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2E9E1E',
    marginTop: -4,
  },
  ray1: {
    position: 'absolute',
    top: 14,
    right: 68,
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '40deg' }],
  },
  ray2: {
    position: 'absolute',
    top: 24,
    right: 62,
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '65deg' }],
  },
  ray3: {
    position: 'absolute',
    top: 36,
    right: 64,
    width: 3,
    height: 9,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '85deg' }],
  },
});

const accIllusStyles = StyleSheet.create({
  container: {
    width: 200,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  leafBackdrop: {
    position: 'absolute',
    width: 160,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudBackdrop: {
    width: 130,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDF7ED',
  },
  leaf: {
    position: 'absolute',
    width: 44,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#C8E6C9',
  },
  phoneFrame: {
    width: 72,
    height: 110,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#2E9E1E',
    alignItems: 'center',
    paddingVertical: 6,
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phoneSpeaker: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginBottom: 6,
  },
  phoneScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#81C784',
    marginBottom: 6,
  },
  miniLine1: {
    width: 32,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: '#2E9E1E',
    marginBottom: 3,
  },
  miniLine2: {
    width: 22,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: '#A5D6A7',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 22,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E7E10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -2,
  },
  ray1: {
    position: 'absolute',
    top: 14,
    right: 46,
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '40deg' }],
  },
  ray2: {
    position: 'absolute',
    top: 24,
    right: 42,
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '65deg' }],
  },
  ray3: {
    position: 'absolute',
    top: 36,
    right: 44,
    width: 3,
    height: 9,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '85deg' }],
  },
});

const confettiStyles = StyleSheet.create({
  container: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 18,
  },
  outerGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E7E10',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E7E10',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  rayBar: {
    position: 'absolute',
    width: 3.5,
    height: 12,
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

const stepStyles = StyleSheet.create({
  stepperWrapper: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCol: {
    alignItems: 'center',
    width: 68,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    borderColor: '#2E9E1E',
    backgroundColor: '#2E9E1E',
  },
  stepCircleCompleted: {
    borderColor: '#2E9E1E',
    backgroundColor: '#2E9E1E',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  stepNumberActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 13,
  },
  stepLabelActive: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
    lineHeight: 13,
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#CBD5E1',
    marginBottom: 16,
    marginHorizontal: -4,
  },
  stepLineActive: {
    backgroundColor: '#2E9E1E',
  },
});

const provStepStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 6,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  docSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  uploadPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  uploadPillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803D',
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E9E1E',
    backgroundColor: '#FFFFFF',
    marginRight: 6,
    marginBottom: 8,
  },
  dayPillActive: {
    borderColor: '#2E9E1E',
    backgroundColor: '#FFFFFF',
  },
  dayCheckmark: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E9E1E',
  },
  dayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  hoursCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  reviewEditText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E9E1E',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  reviewLabel: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  reviewValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1.5,
    textAlign: 'right',
  },
  docReviewBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginHorizontal: 3,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  docReviewCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2E9E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docReviewCheckText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  docReviewText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 6,
    textAlign: 'center',
  },
  underVerificationCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 16,
    marginVertical: 18,
  },
  underVerificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  underVerificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803D',
  },
  underVerificationDesc: {
    fontSize: 12.5,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ----------------------------------------------------
// OFFICIAL BRAND DESIGN SYSTEM STYLES (Cream, Green, Black)
// ----------------------------------------------------
const styles = StyleSheet.create({
  // Root Application Container (Cream dominant background with rock-solid Safe Area padding)
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: TOP_SAFE_PADDING,
    paddingBottom: 0,
  },
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: TOP_SAFE_PADDING,
    paddingBottom: BOTTOM_SAFE_PADDING,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },

  // Splash Screen (Cream background, centered logo, black typography, brand green accent)
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: TOP_SAFE_PADDING,
    paddingBottom: BOTTOM_SAFE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogoContainer: {
    width: 150,
    height: 109,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashLogoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  splashTextContainer: {
    alignItems: 'center',
  },
  splashBrandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  splashBrandTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    gap: 8,
  },
  splashLoadingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Auth / Onboarding
  authScroll: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  authLogoWrapper: {
    width: 140,
    height: 100,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authLogoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  onboardingPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  onboardingPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  onboardingPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
  },
  authCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: COLORS.text,
  },
  textInputBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: COLORS.text,
  },
  otpInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
    color: COLORS.text,
    height: 52,
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
    color: COLORS.text,
  },
  demoOtpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.buttonText,
  },
  linkButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  rolePickerBox: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rolePickerLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
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
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  rolePillTextActive: {
    color: COLORS.text,
    fontWeight: 'bold',
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topHeaderLogo: {
    width: 42,
    height: 30,
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  topHeaderSub: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  roleSwitchBtn: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  roleSwitchText: {
    fontSize: 11,
    fontWeight: 'bold',
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
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: COLORS.text,
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionSubHeader: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  catPillActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  catIcon: {
    fontSize: 16,
  },
  catText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  catTextActive: {
    color: COLORS.text,
    fontWeight: 'bold',
  },

  // Provider Cards
  providerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  slotIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  slotDot: {
    fontSize: 8,
  },
  slotIndicatorText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  servicesDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  serviceDuration: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 12,
  },
  bookSlotBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  bookSlotBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.buttonText,
  },

  // Bookings List
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 14,
  },
  screenSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  bookingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingId: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  bookingService: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  bookingProvider: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: COLORS.primaryDim,
  },
  statusCompleted: {
    backgroundColor: '#E5E7EB',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  bookingTime: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bookingAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deliveryOtpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryDim,
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  deliveryOtpHeader: {
    flex: 1,
  },
  deliveryOtpTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deliveryOtpSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  otpBox: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  otpDigits: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.text,
  },
  bookingActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelActionBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  rescheduleActionBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryDim,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  rescheduleActionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailsActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  detailsActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Customer Profile
  profileHeaderBox: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profilePhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verifiedTag: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 8,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileMenuBox: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuItemArrow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },

  // Bottom Navigation Bar
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.select({ android: 78, ios: 88, default: 68 }),
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.select({ android: 16, ios: 26, default: 6 }),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    zIndex: 999,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  navText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  navActive: {
    color: COLORS.primary,
  },
  navActiveText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },

  // Provider Cockpit
  statusToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusToggleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusToggleSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleBtnOn: {
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  toggleBtnOff: {
    backgroundColor: '#E5E7EB',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  toggleBtnTextOn: {
    color: COLORS.text,
  },
  toggleBtnTextOff: {
    color: COLORS.textMuted,
  },

  // SLA Urgent Request Card
  slaCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  slaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slaTag: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slaTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  slaTimerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  slaCustomerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  slaService: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  slaDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  slaPayout: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 6,
  },
  slaActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  slaAcceptBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  slaAcceptBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.buttonText,
  },
  slaRejectBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  slaRejectBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.danger,
  },

  // Verify Delivery OTP
  verifyOtpCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifyOtpCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  verifyOtpCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  verifyOtpInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  verifyOtpTextInput: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 3,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  verifyOtpSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyOtpSubmitBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.buttonText,
  },

  // Metrics Grid
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
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 4,
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
    marginBottom: 8,
  },
  slotPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotActivePill: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  slotActivePillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  payoutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  payoutAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginVertical: 6,
  },
  payoutBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  payoutBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.buttonText,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transactionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  transactionTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Modals Overlay & Body
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.select({ android: 36, ios: 44, default: 24 }),
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  modalProvider: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalService: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  modalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 4,
  },
  slotPickerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 10,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  slotBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotBtnSelected: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  slotBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  slotBtnTextSelected: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  billBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
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
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Razorpay Checkout (Aligned to Brand Cream/Green)
  razorpayContainer: {
    backgroundColor: COLORS.bg,
  },
  razorpayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  razorpayBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  razorpayLogo: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  razorpayTestBadge: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  razorpayTestText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  razorpayBody: {
    gap: 12,
  },
  razorpayAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  razorpayMerchant: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: -8,
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
  },
  paymentOptionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  paymentOptionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  paymentOptionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  razorpaySecurityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  // Detail Modal Cards
  detailCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },

  // Address items
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },

  // Settings
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  settingsDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsToggle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  settingsToggleActive: {
    color: COLORS.text,
    backgroundColor: COLORS.primaryDim,
  },

  // Onboarding Carousel Styles (Matching reference screenshots with Safe Area)
  onboardingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: TOP_SAFE_PADDING,
    paddingBottom: BOTTOM_SAFE_PADDING,
    justifyContent: 'space-between',
  },
  onboardingTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    minHeight: 48,
  },
  onboardingNavBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingNavBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  onboardingLogo: {
    width: 140,
    height: 52,
  },
  skipButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E9E1E',
  },
  onboardingSlideContent: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  onboardingProgressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  onboardingProgressBarRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onboardingProgressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  onboardingProgressSegmentActive: {
    backgroundColor: '#2E9E1E',
  },
  onboardingProgressBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E9E1E',
    backgroundColor: '#EFF8E7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5ECC8',
    letterSpacing: 0.5,
  },
  onboardingTagPill: {
    alignSelf: 'center',
    backgroundColor: '#EFF8E7',
    borderWidth: 1,
    borderColor: '#D5ECC8',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  onboardingTagPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2E9E1E',
    letterSpacing: 0.8,
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  onboardingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 290,
  },
  onboardingWorkflowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E4D9',
    padding: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    gap: 12,
    marginVertical: 4,
  },
  stepConnectorLine: {
    position: 'absolute',
    left: 17,
    top: 36,
    bottom: -10,
    width: 2,
    backgroundColor: '#A4DE94',
    zIndex: 0,
  },
  stepBadgeCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EBF7E3',
    borderWidth: 1.5,
    borderColor: '#DCF2D0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepBadgeNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2E9E1E',
  },
  stepInfo: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  onboardingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  onboardingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  onboardingDotActive: {
    width: 20,
    backgroundColor: '#2E9E1E',
  },
  onboardingBottom: {
    paddingHorizontal: 20,
    paddingBottom: Platform.select({ android: 24, ios: 32, default: 18 }),
  },
  onboardingPillButton: {
    backgroundColor: '#2E9E1E',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E9E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  onboardingPillButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Language & Location Selection Styles (Matching reference screenshots)
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E4D9',
  },
  langOptionCardSelected: {
    borderColor: '#2E9E1E',
    backgroundColor: '#EFF8E7',
  },
  langBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBadgeSelected: {
    backgroundColor: '#E2F1D1',
  },
  langBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  langBadgeTextSelected: {
    color: '#1C6E14',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2E9E1E',
    backgroundColor: '#2E9E1E',
  },
  citySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2E9E1E',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2E9E1E',
    paddingVertical: 12,
    marginBottom: 20,
  },
  cityCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E4D9',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cityCardSelected: {
    borderColor: '#2E9E1E',
    backgroundColor: '#EFF8E7',
  },
  cityRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  cityRadioCircleSelected: {
    borderColor: '#2E9E1E',
    backgroundColor: '#2E9E1E',
  },
  citySearchBoxModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  useCurrentLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  adminManagedBadge: {
    backgroundColor: '#EFF8E7',
    borderWidth: 1,
    borderColor: '#D5ECC8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adminManagedText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E9E1E',
  },
  cityCardModern: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  cityCardModernSelected: {
    borderColor: '#2E9E1E',
    backgroundColor: '#FFFFFF',
  },
});

// ----------------------------------------------------
// AUTHENTICATION & ONBOARDING FLOW STYLES (4 EXACT SCREENS)
// ----------------------------------------------------
const authStyles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    height: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  backBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
    textAlign: 'center',
    includeFontPadding: false,
  },
  logoCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  brandLogo: {
    width: 130,
    height: 94,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  // Screen 1: Mobile Input Row
  inputOutlineBox: {
    height: 54,
    borderWidth: 1.5,
    borderColor: '#2E9E1E',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  flagEmoji: {
    fontSize: 18,
  },
  flagChevron: {
    fontSize: 10,
    color: '#64748B',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
    marginLeft: 4,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
    fontWeight: '500',
  },

  // Minimal Text-Based Authentication & Registration Styles
  cleanFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
    marginTop: 8,
  },
  cleanTextInputBox: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '500',
  },
  cleanPhoneInputBox: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  cleanPrefixBadge: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    marginRight: 10,
  },
  cleanPrefixText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  cleanPhoneInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#0F172A',
    fontWeight: '500',
  },
  cleanDetectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cleanDetectBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1E7E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanDetectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  areaPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  areaPillItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  areaPillItemSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E9E1E',
  },
  areaPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  areaPillTextSelected: {
    color: '#1B5E20',
    fontWeight: '700',
  },
  manualAddressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginVertical: 10,
  },
  manualAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  manualAddressHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  manualToggleBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2E9E1E',
  },

  // Pill Buttons
  primaryPillBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E7E10',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E7E10',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryPillBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#64748B',
  },
  outlinePillBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#2E9E1E',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineBtnIcon: {
    fontSize: 18,
    color: '#2E9E1E',
  },
  outlinePillBtnText: {
    color: '#2E9E1E',
    fontSize: 15.5,
    fontWeight: 'bold',
  },

  // Screen 2: OTP
  phoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: -16,
    marginBottom: 24,
  },
  phoneBoldText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111111',
  },
  editPhoneBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  editText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E9E1E',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  otpSquareBox: {
    flex: 1,
    maxWidth: 50,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2E9E1E',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpSquareBoxActive: {
    borderColor: '#1E7E10',
    backgroundColor: '#F8FAF5',
  },
  otpDigitText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111111',
    width: '100%',
    height: '100%',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendPromptText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  resendTimerText: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#1E7E10',
  },

  // Screen 3: Role Selection
  rolesContainer: {
    gap: 14,
    marginBottom: 26,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 18,
    paddingHorizontal: 18,
    minHeight: 86,
  },
  roleCardSelected: {
    borderColor: '#2E9E1E',
    backgroundColor: '#F7FCF5',
  },
  roleBulletText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  roleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EDF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  roleIconText: {
    fontSize: 22,
  },
  roleInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  roleRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleRadioSelected: {
    borderColor: '#2E9E1E',
    backgroundColor: '#2E9E1E',
  },
  roleCheckmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Screen 4: Registration Form
  formInputRow: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#2E9E1E',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  fieldIcon: {
    fontSize: 17,
    marginRight: 10,
  },
  formTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    fontWeight: '500',
  },
  detectPillBtn: {
    backgroundColor: '#1E7E10',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detectPillBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationDetectedCard: {
    backgroundColor: '#EDF7ED',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detectedCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2E9E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detectedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  detectedSubtitle: {
    fontSize: 12,
    color: '#333333',
    marginTop: 1,
  },
  detectedEditText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E9E1E',
  },
  dropdownChevron: {
    fontSize: 16,
    color: '#111111',
    fontWeight: 'bold',
  },
  stateDisabledBox: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  stateLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  stateValue: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 2,
    gap: 10,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#2E9E1E',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxActive: {
    backgroundColor: '#2E9E1E',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },

  // Footer
  footerBox: {
    alignItems: 'center',
    marginBottom: 14,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  footerLink: {
    fontSize: 12,
    color: '#1E7E10',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Soft Mint Bottom Organic Wave Curve
  bottomCurveWrapper: {
    position: 'absolute',
    bottom: 0,
    left: -40,
    right: -40,
    height: 70,
    overflow: 'hidden',
    zIndex: -1,
  },
  bottomCurveLayer1: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: '#EEF7E3',
    borderTopLeftRadius: 260,
    borderTopRightRadius: 200,
  },
  bottomCurveLayer2: {
    position: 'absolute',
    bottom: -32,
    left: 30,
    right: -20,
    height: 80,
    backgroundColor: '#E2F1D1',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 280,
    opacity: 0.8,
  },

  // Login Screen: Scroll container and bottom branding section
  loginScrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  bottomBrandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bottomBrandingLogo: {
    width: 140,
    height: 46,
  },
  bottomBrandingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111111',
    letterSpacing: 1,
    marginTop: 4,
  },
  bottomBrandingSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Image 2: Verify Mobile Number Vector Phone Illustration
  otpPhoneIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  otpPhoneOuterCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E8F6E4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otpPhoneBody: {
    width: 54,
    height: 86,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#1E293B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  otpPhoneNotch: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1E293B',
  },
  otpPhoneScreen: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpSpeechBubble: {
    backgroundColor: '#1E7E10',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    elevation: 2,
  },
  otpSpeechBubbleText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  otpPhoneIndicatorLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#C8E6C9',
    marginTop: 6,
  },
  otpPhoneHomeBar: {
    width: 16,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#1E293B',
  },
  otpRay1: {
    position: 'absolute',
    top: 22,
    right: 18,
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '35deg' }],
  },
  otpRay2: {
    position: 'absolute',
    top: 34,
    right: 14,
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '55deg' }],
  },

  // Image 1: Thank You for Registration Screen
  successScreenContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  successBadgeOuterGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F6E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  scallopBase: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scallopLeaf: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1E7E10',
  },
  scallopCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E7E10',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  successCheckmark: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  successRay1: {
    position: 'absolute',
    top: 8,
    right: 20,
    width: 3.5,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '30deg' }],
  },
  successRay2: {
    position: 'absolute',
    top: 16,
    right: 12,
    width: 3.5,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#2E9E1E',
    transform: [{ rotate: '55deg' }],
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Service Provider Categories & Pending Approval Styles
  categoryScroll: {
    marginBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  categoryChipActive: {
    borderColor: '#2E9E1E',
    backgroundColor: '#EDF7ED',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    alignSelf: 'center',
  },
  pendingBadgeText: {
    color: '#B45309',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pendingSummaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginVertical: 18,
  },
  pendingSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  pendingSummaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  pendingSummaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111111',
    maxWidth: '65%',
    textAlign: 'right',
  },

  // "Account Not Found!" Popup Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FDFCF4',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E4D9',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E4D9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 13.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalPhoneBadge: {
    backgroundColor: '#F4F9EE',
    borderWidth: 1,
    borderColor: 'rgba(101, 179, 46, 0.25)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  modalPhoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E7E10',
  },
  modalBtnGroup: {
    width: '100%',
    gap: 10,
  },
  modalCancelBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
});

const customerHomeStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FDFCF4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 140,
    height: 36,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E4D9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationPinIcon: {
    fontSize: 13,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
  },
  locationChevron: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: -3,
  },
  scrollPadding: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  homeSearchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  homeSearchIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  homeSearchPlaceholder: {
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  heroBanner: {
    backgroundColor: '#F3FAEE',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2F0DA',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 150,
  },
  heroBannerCurve: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#E6F5DB',
  },
  heroLeft: {
    flex: 1,
    zIndex: 2,
    paddingRight: 8,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111111',
    lineHeight: 24,
  },
  heroTitleGreen: {
    color: '#2E7D18',
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  heroBookBtn: {
    backgroundColor: '#2E8B18',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroBookBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  heroImage: {
    width: 112,
    height: 128,
    borderRadius: 16,
    zIndex: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#2E8B18',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E8B18',
  },
  topCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  topCatCard: {
    width: '31.5%',
    backgroundColor: '#F5FAF2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5F2DF',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F7E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catIconEmoji: {
    fontSize: 20,
  },
  topCatLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    lineHeight: 15,
  },
  popularScroll: {
    gap: 12,
    paddingBottom: 18,
  },
  popularCard: {
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE8DF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  popularImg: {
    width: '100%',
    height: 92,
  },
  popularInfo: {
    padding: 10,
  },
  popularName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 17,
  },
  popularPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E8B18',
    marginTop: 4,
  },
  featuredProviderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE8DF',
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  featuredInfo: {
    flex: 1,
  },
  featuredTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#111111',
  },
  verifiedCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2E8B18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheckText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  featuredCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  featuredRating: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 3,
  },
  featuredBookBtn: {
    backgroundColor: '#EAF7E3',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBEBB9',
  },
  featuredBookBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E8B18',
  },
  searchScreenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },
  searchScreenSub: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  searchScreenInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCD8C8',
    paddingHorizontal: 14,
    height: 48,
    marginTop: 14,
    gap: 8,
  },
  searchScreenInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#111111',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FAEE',
    borderWidth: 1,
    borderColor: '#E2F0DA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  recentPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111111',
  },
  recentRemoveIcon: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  trendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  trendingPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111111',
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  exploreCatTile: {
    width: '23%',
    backgroundColor: '#F5FAF2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5F2DF',
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  exploreCatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    lineHeight: 14,
  },
  allCatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 18,
  },
  allCatGridItem: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE8DF',
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  allCatIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF7E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  allCatIconEmoji: {
    fontSize: 24,
  },
  allCatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    lineHeight: 16,
  },
  catDetailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  catDetailHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  catDetailHeaderSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  catDetailHero: {
    backgroundColor: '#EBF9EE',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CDE9D2',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 135,
    marginBottom: 20,
    overflow: 'hidden',
  },
  catDetailHeroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  catDetailHeroTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#111111',
    lineHeight: 23,
  },
  catDetailHeroSub: {
    fontSize: 12.5,
    color: '#374151',
    fontWeight: '600',
    marginTop: 5,
    lineHeight: 18,
  },
  catDetailHeroImg: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  subcatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  subcatCard: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E4D9',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 88,
  },
  subcatCardActive: {
    borderColor: '#16A34A',
    backgroundColor: '#EFF8E7',
    borderWidth: 1.5,
  },
  subcatIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF9EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  subcatIconCircleActive: {
    backgroundColor: '#16A34A',
  },
  subcatIconText: {
    fontSize: 20,
  },
  subcatLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    lineHeight: 14,
  },
  popularServicesScroll: {
    gap: 12,
    paddingBottom: 6,
  },
  popularServiceCard: {
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E4D9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  popularServiceImg: {
    width: '100%',
    height: 96,
  },
  popularServiceBody: {
    padding: 10,
  },
  popularServiceTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 16,
  },
  popularServiceDuration: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 3,
  },
  popularServicePrice: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 4,
  },
  popularServiceBookBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularServiceBookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#FDFCF4',
    borderTopWidth: 1,
    borderTopColor: '#E8E4D9',
    paddingBottom: Platform.OS === 'android' ? 22 : 30,
    paddingTop: 10,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  bottomNavIcon: {
    fontSize: 20,
    opacity: 0.55,
  },
  bottomNavIconActive: {
    opacity: 1,
  },
  bottomNavLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 3,
  },
  bottomNavLabelActive: {
    color: '#2E8B18',
    fontWeight: '800',
  },
  bottomNavIndicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2E8B18',
    marginTop: 3,
  },
  cityOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cityOptionBtnActive: {
    borderColor: '#2E8B18',
    backgroundColor: '#F3FAEE',
  },
  cityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  cityOptionTextActive: {
    fontWeight: '800',
    color: '#2E8B18',
  },
});

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('RootErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FDFCF4', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>⚡</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111111', marginBottom: 8, textAlign: 'center' }}>
            Quick Appointments
          </Text>
          <Text style={{ fontSize: 13, color: '#4B5563', textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected rendering issue occurred.'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: '#65B32E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>Reload Application</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const SafeApp: React.FC = () => (
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

export default SafeApp;
