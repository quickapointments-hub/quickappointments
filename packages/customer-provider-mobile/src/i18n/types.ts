export type SupportedLanguage = 
  | 'en' // English (Default)
  | 'te' // Telugu
  | 'hi' // Hindi
  | 'ta' // Tamil
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'mr' // Marathi
  | 'bn' // Bengali
  | 'gu' // Gujarati
  | 'pa'; // Punjabi

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export interface TranslationDictionary {
  // Common
  app_name: string;
  tagline: string;
  next: string;
  skip: string;
  back: string;
  cancel: string;
  confirm: string;
  save: string;
  loading: string;
  search: string;
  filter: string;
  view_all: string;
  reschedule: string;
  close: string;
  select: string;
  success: string;
  error: string;

  // Onboarding
  onboarding_title_1: string;
  onboarding_highlight_1: string;
  onboarding_sub_1: string;
  step1_title: string;
  step1_desc: string;
  step2_title: string;
  step2_desc: string;
  step3_title: string;
  step3_desc: string;
  get_started: string;

  // Auth & OTP
  create_account_title: string;
  create_highlight: string;
  account_word: string;
  create_account_sub: string;
  full_name: string;
  mobile_number: string;
  email_optional: string;
  create_password: string;
  password_hint: string;
  terms_agree: string;
  terms_link: string;
  privacy_link: string;
  already_have_account: string;
  login_link: string;
  verify_number_title: string;
  verify_highlight: string;
  your_number: string;
  otp_sent_to: string;
  resend_otp_in: string;
  resend_otp_now: string;
  verify_otp_btn: string;

  // Navigation
  tab_home: string;
  tab_explore: string;
  tab_search?: string;
  tab_bookings: string;
  tab_support: string;
  tab_profile: string;
  tab_dashboard: string;
  tab_availability: string;
  tab_reviews: string;
  tab_earnings: string;

  // Customer Home
  verified_categories: string;
  top_specialists: string;
  instant_booking: string;
  book_now: string;
  from_price: string;

  // Customer Bookings
  my_appointments: string;
  active_bookings: string;
  past_bookings: string;
  scheduled_for: string;
  booking_status_confirmed: string;
  booking_status_completed: string;
  booking_status_cancelled: string;
  service_otp: string;
  share_otp_with_provider: string;

  // Profile & Settings
  profile: string;
  edit_profile: string;
  saved_addresses: string;
  language: string;
  choose_language: string;
  notifications: string;
  help_center: string;
  logout: string;
  switch_to_provider: string;
  switch_to_customer: string;

  // Provider Cockpit
  provider_dashboard: string;
  today_schedule: string;
  accept_booking: string;
  reject_booking: string;
  complete_booking: string;
  enter_customer_otp: string;
  total_earnings: string;
  weekly_payout: string;
  manage_slots: string;
}

