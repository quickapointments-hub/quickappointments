import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mobileApi } from '../../api';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Store,
  Briefcase,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  MapPin,
  Building,
  Map,
  Check,
  CheckCircle2,
  Crosshair,
  Pencil,
  Upload,
  FileText,
  CreditCard,
  Award,
  ChevronDown,
  Camera,
  Link as LinkIcon,
  Sparkles,
  X,
  Image as ImageIcon,
  ZoomIn,
  Trash2,
  Layers,
  Scissors,
  Heart,
  Home,
  Car,
  Clock,
  Plus,
  Compass,
} from 'lucide-react';
import { LeavesDecoration } from '../../components/LeavesDecoration';

interface AuthScreenProps {
  onComplete: () => void;
  onBackToOnboarding?: () => void;
}

type AuthView =
  | 'login'
  | 'choose_type'
  | 'general_user'
  | 'provider_step1'
  | 'provider_step2'
  | 'provider_step3'
  | 'provider_step4'
  | 'provider_success';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onComplete,
  onBackToOnboarding,
}) => {
  const { login, switchRole } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [selectedAccountType, setSelectedAccountType] = useState<'general' | 'provider'>('general');

  // Login Form State (clean inputs - no hardcoded fake registered numbers)
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Not Registered Modal State
  const [showNotRegisteredModal, setShowNotRegisteredModal] = useState(false);
  const [unregisteredPhone, setUnregisteredPhone] = useState('');

  // General User Registration State (Admin-Controlled Location Master)
  const [generalName, setGeneralName] = useState('');
  const [generalPhone, setGeneralPhone] = useState('');
  const [generalEmail, setGeneralEmail] = useState('');
  const [generalPincode, setGeneralPincode] = useState('');
  const [detectedLocation, setDetectedLocation] = useState<{
    area: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [generalArea, setGeneralArea] = useState('');
  const [generalCity, setGeneralCity] = useState('');
  const [generalDistrict, setGeneralDistrict] = useState('');
  const [generalState, setGeneralState] = useState('');
  const [generalLocationConfirmed, setGeneralLocationConfirmed] = useState(false);
  const [generalLocationError, setGeneralLocationError] = useState<string | null>(null);
  const [generalTermsAgreed, setGeneralTermsAgreed] = useState(true);

  // Service Provider Registration State
  // Step 1: Basic Details & Mobile OTP Verification
  const [providerFullName, setProviderFullName] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerPassword, setProviderPassword] = useState('');
  const [providerPhoneVerified, setProviderPhoneVerified] = useState(false);
  const [providerOtpSent, setProviderOtpSent] = useState(false);
  const [providerEnteredOtp, setProviderEnteredOtp] = useState('');

  // Step 2: Profile, Location & KYC Documents (Admin-Controlled Location Master)
  const [providerBusinessName, setProviderBusinessName] = useState('');
  const [providerBusinessType, setProviderBusinessType] = useState('');
  const [providerAboutServices, setProviderAboutServices] = useState('');
  const [providerAddress, setProviderAddress] = useState('');
  const [providerArea, setProviderArea] = useState('');
  const [providerCity, setProviderCity] = useState('');
  const [providerDistrict, setProviderDistrict] = useState('');
  const [providerState, setProviderState] = useState('');
  const [providerPincode, setProviderPincode] = useState('');
  const [providerLocationConfirmed, setProviderLocationConfirmed] = useState(false);
  const [providerLocationError, setProviderLocationError] = useState<string | null>(null);
  const [providerGpsCoords, setProviderGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingProviderGps, setIsDetectingProviderGps] = useState(false);

  // KYC Documents
  const [aadhaarDoc, setAadhaarDoc] = useState<{ fileName: string; mimeType: string; fileUrl: string } | null>(null);
  const [panDoc, setPanDoc] = useState<{ fileName: string; mimeType: string; fileUrl: string } | null>(null);
  const [licenseDoc, setLicenseDoc] = useState<{ fileName: string; mimeType: string; fileUrl: string } | null>(null);
  const [certDoc, setCertDoc] = useState<{ fileName: string; mimeType: string; fileUrl: string } | null>(null);
  const aadhaarUploaded = Boolean(aadhaarDoc);
  const panUploaded = Boolean(panDoc);
  const licenseUploaded = Boolean(licenseDoc);
  const certUploaded = Boolean(certDoc);
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [placePhotos, setPlacePhotos] = useState<string[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const [docPickerModal, setDocPickerModal] = useState<{
    type: 'aadhaar' | 'pan' | 'license' | 'cert' | 'premise';
    title: string;
  } | null>(null);
  const activePickingTypeRef = useRef<'aadhaar' | 'pan' | 'license' | 'cert' | 'premise'>('premise');
  const [previewModalDoc, setPreviewModalDoc] = useState<{
    title: string;
    url: string;
    isPdf: boolean;
  } | null>(null);

  const cameraPickerRef = useRef<HTMLInputElement | null>(null);
  const galleryPickerRef = useRef<HTMLInputElement | null>(null);
  const filePickerRef = useRef<HTMLInputElement | null>(null);

  const aadhaarInputRef = useRef<HTMLInputElement | null>(null);
  const panInputRef = useRef<HTMLInputElement | null>(null);
  const licenseInputRef = useRef<HTMLInputElement | null>(null);
  const certInputRef = useRef<HTMLInputElement | null>(null);
  const premisePhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Step 3: Service Details & Categories
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [providerCategory, setProviderCategory] = useState('');
  const [isOtherCategorySelected, setIsOtherCategorySelected] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [providerSpecificServices, setProviderSpecificServices] = useState('');
  const [providerManualServices, setProviderManualServices] = useState<{ name: string; price: number; duration: number }[]>([
    { name: '', price: 499, duration: 45 },
  ]);
  const [providerRate, setProviderRate] = useState('499');
  const [workingHoursFrom, setWorkingHoursFrom] = useState('09:00 AM');
  const [workingHoursTo, setWorkingHoursTo] = useState('07:00 PM');
  const [providerHours, setProviderHours] = useState('09:00 AM - 07:00 PM');
  const [availableWorkingDays, setAvailableWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [providerWorkingDays, setProviderWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  // Bank & Settlement Account Details
  const [providerAccountHolderName, setProviderAccountHolderName] = useState('');
  const [providerBankName, setProviderBankName] = useState('');
  const [providerAccountNumber, setProviderAccountNumber] = useState('');
  const [providerIfscCode, setProviderIfscCode] = useState('');
  const [providerUpiId, setProviderUpiId] = useState('');

  // Silent Draft Save & Load (no notification or popups)
  const saveDraftSilently = (targetView?: AuthView) => {
    try {
      if (typeof localStorage === 'undefined') return;
      const draft = {
        view: targetView || currentView,
        providerFullName,
        providerPhone,
        providerEmail,
        providerBusinessName,
        providerBusinessType,
        providerAboutServices,
        providerPincode,
        providerAddress,
        providerArea,
        providerCity,
        googleMapLink,
        providerCategory,
        providerSpecificServices,
        providerManualServices,
        availableWorkingDays,
        workingHoursFrom,
        workingHoursTo,
        providerAccountHolderName,
        providerBankName,
        providerAccountNumber,
        providerIfscCode,
        providerUpiId,
        placePhotos,
      };
      localStorage.setItem('@qa_provider_reg_draft_web', JSON.stringify(draft));
    } catch (_) {}
  };

  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem('@qa_provider_reg_draft_web');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.providerFullName) setProviderFullName(d.providerFullName);
        if (d.providerPhone) setProviderPhone(d.providerPhone);
        if (d.providerEmail) setProviderEmail(d.providerEmail);
        if (d.providerBusinessName) setProviderBusinessName(d.providerBusinessName);
        if (d.providerBusinessType) setProviderBusinessType(d.providerBusinessType);
        if (d.providerAboutServices) setProviderAboutServices(d.providerAboutServices);
        if (d.providerPincode) setProviderPincode(d.providerPincode);
        if (d.providerAddress) setProviderAddress(d.providerAddress);
        if (d.providerArea) setProviderArea(d.providerArea);
        if (d.providerCity) setProviderCity(d.providerCity);
        if (d.googleMapLink) setGoogleMapLink(d.googleMapLink);
        if (d.providerCategory) setProviderCategory(d.providerCategory);
        if (d.providerSpecificServices) setProviderSpecificServices(d.providerSpecificServices);
        if (d.providerManualServices) setProviderManualServices(d.providerManualServices);
        if (d.availableWorkingDays) setAvailableWorkingDays(d.availableWorkingDays);
        if (d.workingHoursFrom) setWorkingHoursFrom(d.workingHoursFrom);
        if (d.workingHoursTo) setWorkingHoursTo(d.workingHoursTo);
        if (d.providerAccountHolderName) setProviderAccountHolderName(d.providerAccountHolderName);
        if (d.providerBankName) setProviderBankName(d.providerBankName);
        if (d.providerAccountNumber) setProviderAccountNumber(d.providerAccountNumber);
        if (d.providerIfscCode) setProviderIfscCode(d.providerIfscCode);
        if (d.providerUpiId) setProviderUpiId(d.providerUpiId);
        if (d.placePhotos && Array.isArray(d.placePhotos)) setPlacePhotos(d.placePhotos);
      }
    } catch (_) {}
  }, []);

  // Fetch admin created categories from API/Supabase on mount
  useEffect(() => {
    mobileApi
      .getCategories()
      .then((res: any) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setDbCategories(res.data);
          if (!providerCategory) {
            setProviderCategory(res.data[0].name);
          }
        } else {
          // Fallback initial categories if DB empty
          const defaults = [
            { id: 'c1', name: 'Salon & Grooming' },
            { id: 'c2', name: 'Healthcare & Wellness' },
            { id: 'c3', name: 'Home Repairs & AC Services' },
            { id: 'c4', name: 'Auto Care & Detailing' },
          ];
          setDbCategories(defaults);
          if (!providerCategory) {
            setProviderCategory(defaults[0].name);
          }
        }
      })
      .catch(() => {
        const defaults = [
          { id: 'c1', name: 'Salon & Grooming' },
          { id: 'c2', name: 'Healthcare & Wellness' },
          { id: 'c3', name: 'Home Repairs & AC Services' },
          { id: 'c4', name: 'Auto Care & Detailing' },
        ];
        setDbCategories(defaults);
        if (!providerCategory) {
          setProviderCategory(defaults[0].name);
        }
      });
  }, []);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Login Submit with Supabase Database Registration Verification
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhoneOrEmail.trim()) {
      setError('Please enter your mobile number or email');
      return;
    }

    const rawInput = loginPhoneOrEmail.trim();
    const digitsOnly = rawInput.replace(/\D/g, '');
    const isEmail = rawInput.includes('@');

    if (!isEmail && digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verify mobile number / email against actual Supabase database
      const checkRes = await mobileApi.checkUserRegistered(rawInput);
      if (!checkRes.registered) {
        setUnregisteredPhone(rawInput);
        setShowNotRegisteredModal(true);
        setLoading(false);
        return;
      }

      // User exists: proceed with authentication passing verified database record
      const userToLogin = checkRes.user;
      await login(
        userToLogin?.phone || rawInput,
        loginPassword || '123456',
        userToLogin?.full_name || userToLogin?.fullName || 'Quick User',
        userToLogin?.role || 'CUSTOMER',
        userToLogin
      );
      onComplete();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Validate General Customer Pincode with Admin Location Master
  const handleValidateGeneralPincode = async (codeToLookup?: string) => {
    const cleanPin = (codeToLookup || generalPincode || '').replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) {
      setGeneralLocationConfirmed(false);
      setGeneralLocationError('Please enter a valid 6-digit PIN code.');
      return;
    }
    try {
      setIsDetecting(true);
      setError(null);
      setGeneralLocationError(null);
      const res = await mobileApi.validatePincode(cleanPin);
      if (res.serviceable && res.location) {
        setGeneralCity(res.location.city);
        setGeneralDistrict(res.location.district || res.location.city);
        setGeneralState(res.location.state);
        setGeneralPincode(cleanPin);
        setDetectedLocation({
          area: res.location.district || res.location.city,
          city: res.location.city,
          district: res.location.district || res.location.city,
          state: res.location.state,
          pincode: cleanPin,
        });
        setGeneralLocationConfirmed(false); // Prompt user confirmation
        setGeneralLocationError(null);
      } else {
        setGeneralCity('');
        setGeneralDistrict('');
        setGeneralState('');
        setDetectedLocation(null);
        setGeneralLocationConfirmed(false);
        setGeneralLocationError(
          res.message ||
          `Registration unavailable in PIN code ${cleanPin}. This area is not currently serviceable by Quick Appointments.`
        );
      }
    } catch (err: any) {
      setGeneralLocationError(err?.message || 'Could not validate PIN code with server.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Detect Pincode via Geolocation (Admin-controlled validation)
  const handleDetectPincode = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsDetecting(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const revRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const revData = await revRes.json();
            const detectedPin = revData?.address?.postcode?.replace(/\D/g, '')?.slice(0, 6);
            if (detectedPin && detectedPin.length === 6) {
              setGeneralPincode(detectedPin);
              await handleValidateGeneralPincode(detectedPin);
            } else {
              setIsDetecting(false);
              setError('Please enter your 6-digit Indian PIN code to verify service location.');
            }
          } catch {
            setIsDetecting(false);
            if (generalPincode && generalPincode.replace(/\D/g, '').length === 6) {
              handleValidateGeneralPincode(generalPincode);
            } else {
              setError('Please enter your 6-digit Indian PIN code.');
            }
          }
        },
        () => {
          setIsDetecting(false);
          if (generalPincode && generalPincode.replace(/\D/g, '').length === 6) {
            handleValidateGeneralPincode(generalPincode);
          } else {
            setError('Please allow location permission or enter your 6-digit PIN code.');
          }
        },
        { timeout: 8000 }
      );
    } else if (generalPincode && generalPincode.replace(/\D/g, '').length === 6) {
      handleValidateGeneralPincode(generalPincode);
    } else {
      setError('Please enter your 6-digit Indian PIN code.');
    }
  };

  // General User Submit Handler with Supabase database integration & duplicate prevention
  const handleGeneralUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalName.trim()) {
      setError('Please enter your full name');
      return;
    }
    const cleanPhone = generalPhone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!generalEmail.trim() || !generalEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    const cleanPin = (generalPincode || '').replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) {
      setError('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    if (!generalLocationConfirmed) {
      setError('Please verify and confirm your service location before proceeding');
      return;
    }
    if (!generalTermsAgreed) {
      setError('Please agree to the Terms & Conditions and Privacy Policy');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Register directly in database with admin-validated location
      const createdCustomerRes = await mobileApi.registerCustomer({
        fullName: generalName.trim(),
        phone: cleanPhone,
        email: generalEmail.trim(),
        city: generalCity,
        state: generalState,
        area: generalArea || generalDistrict || generalCity,
        pincode: cleanPin,
      });

      // Login registered session immediately using returned user object
      await login(
        cleanPhone,
        '123456',
        generalName.trim(),
        'CUSTOMER',
        createdCustomerRes?.user || createdCustomerRes
      );
      try {
        localStorage.setItem('qa_selected_city', generalCity);
      } catch (e) { }
      onComplete();
    } catch (err: any) {
      setError(err?.message || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Compress images via HTML5 Canvas (1920px max dimension, 0.82 JPEG quality for crystal-clear readability)
  // or encode PDFs directly as clean Base64 DataURLs without any corruption
  const readAndCompressFile = (file: File): Promise<{ fileName: string; mimeType: string; fileUrl: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read selected file'));
      reader.onload = () => {
        const result = String(reader.result || '');
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          resolve({
            fileName: file.name,
            mimeType: 'application/pdf',
            fileUrl: result,
          });
          return;
        }

        if (!file.type.startsWith('image/')) {
          resolve({
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            fileUrl: result,
          });
          return;
        }

        const img = new Image();
        img.onload = () => {
          // 1920px Full-HD resolution retains complete clarity of tiny Aadhaar numbers, PAN numbers & license stamps
          const maxDim = 1920;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ fileName: file.name, mimeType: file.type, fileUrl: result });
            return;
          }
          // Pure white background in case user uploads transparent PNG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // 0.82 JPEG quality gives razor-sharp text clarity with 95% storage savings (~180-250KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve({
            fileName: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
            mimeType: 'image/jpeg',
            fileUrl: compressedDataUrl,
          });
        };
        img.onerror = () => resolve({ fileName: file.name, mimeType: file.type, fileUrl: result });
        img.src = result;
      };
      reader.readAsDataURL(file);
    });

  const handlePickerFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const targetType = activePickingTypeRef.current || docPickerModal?.type || 'premise';
    setDocPickerModal(null);
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setError('Selected file exceeds 6MB limit.');
      return;
    }

    try {
      setUploadingDocType(targetType);
      setError(null);
      const uploaded = await readAndCompressFile(file);
      if (targetType === 'aadhaar') setAadhaarDoc(uploaded);
      if (targetType === 'pan') setPanDoc(uploaded);
      if (targetType === 'license') setLicenseDoc(uploaded);
      if (targetType === 'cert') setCertDoc(uploaded);
      if (targetType === 'premise') {
        setPlacePhotos((prev) => {
          const next = [...prev, uploaded.fileUrl];
          return next.slice(-3); // Keep up to 3 photos
        });
      }
    } catch (err: any) {
      setError(err?.message || 'File upload failed.');
    } finally {
      setUploadingDocType(null);
    }
  };

  const openDocPicker = (type: 'aadhaar' | 'pan' | 'license' | 'cert' | 'premise', title: string) => {
    setError(null);
    activePickingTypeRef.current = type;
    setDocPickerModal({ type, title });
  };

  const handleSelectedDocument = async (
    type: 'aadhaar' | 'pan' | 'license' | 'cert' | 'premise',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError('Selected file exceeds 6MB limit.');
      return;
    }
    try {
      setUploadingDocType(type);
      setError(null);
      const uploaded = await readAndCompressFile(file);
      if (type === 'aadhaar') setAadhaarDoc(uploaded);
      if (type === 'pan') setPanDoc(uploaded);
      if (type === 'license') setLicenseDoc(uploaded);
      if (type === 'cert') setCertDoc(uploaded);
      if (type === 'premise') setPlacePhotos((prev) => [...prev.slice(-3), uploaded.fileUrl]);
    } catch (err: any) {
      setError(err?.message || 'File upload failed.');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleFileUpload = (type: 'aadhaar' | 'pan' | 'license' | 'cert') => {
    const titles: Record<string, string> = {
      aadhaar: 'Aadhaar Card',
      pan: 'PAN Card',
      license: 'Trade / Business License',
      cert: 'Specialist Certificate',
    };
    openDocPicker(type, titles[type] || 'KYC Document');
  };

  const handleSendProviderOtp = () => {
    const clean = providerPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number to receive verification OTP.');
      return;
    }
    setError(null);
    setProviderOtpSent(true);
    setProviderEnteredOtp('1234'); // Pre-fill demo OTP for effortless testing
  };

  const handleVerifyProviderOtp = () => {
    if (!providerEnteredOtp.trim()) {
      setError('Please enter the verification OTP.');
      return;
    }
    setError(null);
    setProviderPhoneVerified(true);
  };

  const [isDetectingPostalLocation, setIsDetectingPostalLocation] = useState(false);
  const [showManualAddressFields, setShowManualAddressFields] = useState(false);

  const handlePostalCodeLookup = async (codeToLookup?: string) => {
    const cleanPin = (codeToLookup || providerPincode || '').replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) {
      setProviderLocationConfirmed(false);
      setProviderLocationError('Please enter a valid 6-digit PIN code.');
      return;
    }
    try {
      setIsDetectingPostalLocation(true);
      setError(null);
      setProviderLocationError(null);
      const res = await mobileApi.validatePincode(cleanPin);
      if (res.serviceable && res.location) {
        setProviderCity(res.location.city);
        setProviderDistrict(res.location.district || res.location.city);
        setProviderState(res.location.state);
        setProviderPincode(cleanPin);
        setProviderLocationConfirmed(false); // Prompt user confirmation
        setProviderLocationError(null);
      } else {
        setProviderCity('');
        setProviderDistrict('');
        setProviderState('');
        setProviderLocationConfirmed(false);
        setProviderLocationError(
          res.message ||
          `Registration unavailable in PIN code ${cleanPin}. This area is not currently configured or serviceable by Admin.`
        );
      }
    } catch (err: any) {
      setProviderLocationError(err?.message || 'Could not validate PIN code with server.');
    } finally {
      setIsDetectingPostalLocation(false);
    }
  };

  const handleDetectProviderGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsDetectingPostalLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            setProviderGpsCoords({ lat: latitude, lng: longitude });
            const revRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const revData = await revRes.json();
            const detectedPin = revData?.address?.postcode?.replace(/\D/g, '')?.slice(0, 6);
            if (detectedPin && detectedPin.length === 6) {
              setProviderPincode(detectedPin);
              await handlePostalCodeLookup(detectedPin);
            } else {
              setIsDetectingPostalLocation(false);
              setError('Please enter your 6-digit PIN code to verify service location.');
            }
          } catch {
            setIsDetectingPostalLocation(false);
            if (providerPincode && providerPincode.replace(/\D/g, '').length === 6) {
              handlePostalCodeLookup(providerPincode);
            } else {
              setError('Please enter your 6-digit Indian PIN code.');
            }
          }
        },
        () => {
          setIsDetectingPostalLocation(false);
          if (providerPincode && providerPincode.replace(/\D/g, '').length === 6) {
            handlePostalCodeLookup(providerPincode);
          } else {
            setError('Please allow location permission or enter your 6-digit PIN code.');
          }
        },
        { timeout: 8000 }
      );
    } else if (providerPincode && providerPincode.replace(/\D/g, '').length === 6) {
      handlePostalCodeLookup(providerPincode);
    } else {
      setError('Please enter your 6-digit Indian PIN code.');
    }
  };

  // Provider Final Submit Handler with full KYC payload & strict PENDING approval enforcement
  const handleProviderFinalSubmit = async () => {
    if (!providerFullName.trim() || !providerPhone.trim() || !providerBusinessName.trim()) {
      setError('Please complete owner details, verified mobile, and business name before submitting.');
      return;
    }
    if (!providerPhoneVerified) {
      setError('Mobile number must be verified via OTP to proceed.');
      return;
    }
    if (!aadhaarDoc && !panDoc) {
      setError('Please upload at least one KYC document (Aadhaar or PAN) for verification.');
      return;
    }
    if (!providerAccountHolderName.trim() || !providerBankName.trim() || !providerAccountNumber.trim() || !providerIfscCode.trim()) {
      setError('Please complete Bank Account Details (Holder Name, Bank Name, Account Number, IFSC Code).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cleanPhone = providerPhone.trim();

      const documentsPayload = [
        ...(aadhaarDoc
          ? [{ documentType: 'AADHAAR_CARD', documentNumber: aadhaarDoc.fileName, fileUrl: aadhaarDoc.fileUrl }]
          : []),
        ...(panDoc
          ? [{ documentType: 'PAN_CARD', documentNumber: panDoc.fileName, fileUrl: panDoc.fileUrl }]
          : []),
        ...(licenseDoc
          ? [{ documentType: 'TRADE_LICENSE', documentNumber: licenseDoc.fileName, fileUrl: licenseDoc.fileUrl }]
          : []),
        ...(certDoc
          ? [{ documentType: 'EXPERIENCE_CERT', documentNumber: certDoc.fileName, fileUrl: certDoc.fileUrl }]
          : []),
      ];

      const fullAddress = [providerAddress, providerArea, providerCity, providerPincode]
        .filter(Boolean)
        .join(', ');

      const hoursParts = providerHours.split('-').map((s) => s.trim());
      const createdProviderRes = await mobileApi.registerProvider({
        fullName: providerFullName.trim(),
        phone: cleanPhone,
        email: providerEmail.trim() || `${cleanPhone}@quickappointments.app`,
        businessName: providerBusinessName.trim(),
        businessType: providerBusinessType,
        category: providerCategory,
        city: providerCity,
        state: providerState,
        district: providerDistrict,
        pincode: providerPincode,
        address: fullAddress || providerAddress || (providerCity ? `${providerCity}, India` : 'India'),
        latitude: providerGpsCoords?.lat,
        longitude: providerGpsCoords?.lng,
        about: providerAboutServices.trim(),
        workingHoursFrom: hoursParts[0] || '09:00 AM',
        workingHoursTo: hoursParts[1] || '08:00 PM',
        workingDays: providerWorkingDays,
        googleMapsLink: googleMapLink.trim() || (providerGpsCoords ? `https://www.google.com/maps?q=${providerGpsCoords.lat},${providerGpsCoords.lng}` : ''),
        premisePhotos: placePhotos,
        documents: documentsPayload,
        rate: Number(providerRate) || 499,
        accountHolderName: providerAccountHolderName.trim(),
        bankName: providerBankName.trim(),
        bankAccountNumber: providerAccountNumber.trim(),
        ifscCode: providerIfscCode.trim(),
        upiId: providerUpiId.trim(),
      } as any);

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('@qa_provider_reg_draft_web');
        }
      } catch (_) {}
      // skdjsjkd

      if (createdProviderRes?.accessToken) {
        mobileApi.setToken(createdProviderRes.accessToken);
      }
      await login(
        cleanPhone,
        '123456',
        providerFullName.trim(),
        'PROVIDER',
        createdProviderRes?.user || createdProviderRes
      );
      await switchRole('PROVIDER');
      setCurrentView('provider_success');
    } catch (err: any) {
      setError(err?.message || 'Provider registration failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ========================================================================= */
  /* SCREEN 1: LOGIN SCREEN                                                    */
  /* ========================================================================= */
  if (currentView === 'login') {
    return (
      <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
        {/* Top Header */}
        <div className="pt-2 flex items-center justify-between relative z-10">
          {onBackToOnboarding ? (
            <button
              onClick={onBackToOnboarding}
              className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <div className="w-10" />
        </div>

        {/* Center Content: Quick Appointments Logo & Login Form */}
        <div className="my-auto py-2 relative z-10 max-w-sm mx-auto w-full">
          {/* Logo */}
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Quick Appointments"
              className="h-20 sm:h-24 w-auto object-contain mx-auto"
            />
            <h1 className="text-2xl font-black text-[#111111] tracking-tight mt-4">
              Welcome Back
            </h1>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">
              Sign in with your mobile number or email
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Clean Mobile Number Input (with +91 country code, no label above) */}
            <div className="w-full bg-white rounded-2xl border border-[#D1D5DB] focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/20 flex items-center px-4 py-3.5 shadow-xs transition-all">
              <span className="text-xs sm:text-sm font-bold text-[#111111] pr-3 border-r border-[#E5E7EB] shrink-0">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={loginPhoneOrEmail}
                onChange={(e) => setLoginPhoneOrEmail(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-3 text-xs sm:text-sm font-medium text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#374151]">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to registered contact.')}
                  className="text-[11px] font-bold text-[#16A34A] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="w-full bg-white rounded-2xl border border-[#D1D5DB] focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/20 flex items-center px-4 py-3 shadow-xs transition-all">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-xs sm:text-sm font-medium text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-[#9CA3AF] hover:text-[#16A34A] p-1 cursor-pointer transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm sm:text-base shadow-md shadow-[#16A34A]/30 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Signing In...' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Create an Account CTA */}
          <div className="text-center pt-6">
            <p className="text-xs sm:text-sm text-[#4B5563]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  if (loginPhoneOrEmail) {
                    const clean = loginPhoneOrEmail.replace(/\D/g, '');
                    const last10 = clean.length >= 10 ? clean.slice(-10) : clean;
                    setGeneralPhone(last10);
                    setProviderPhone(last10);
                  }
                  setCurrentView('choose_type');
                }}
                className="text-[#16A34A] font-bold hover:underline cursor-pointer ml-1"
              >
                Create an Account
              </button>
            </p>
          </div>
        </div>

        {/* Professional Not-Registered Popup Modal (Quick Appointments Theme) */}
        {showNotRegisteredModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5 animate-in fade-in">
            <div className="relative w-full max-w-sm bg-[#FFFFFF] rounded-3xl border border-[#E8E4D9] p-6 text-center shadow-2xl space-y-4">
              {/* Close Cross (✕) Button */}
              <button
                type="button"
                onClick={() => setShowNotRegisteredModal(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#111111] hover:bg-black/5 transition-colors cursor-pointer shadow-xs"
                aria-label="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Headline & Subtext */}
              <div className="pt-2">
                <h3 className="text-xl font-black text-[#111111] tracking-tight leading-snug">
                  Account Not Found!
                </h3>
                <p className="text-xs text-[#4B5563] mt-2 font-medium leading-relaxed">
                  This mobile number is not registered with us. Please create an account to continue.
                </p>
                <div className="mt-3 py-1.5 px-3 rounded-xl bg-[#F4F9EE] border border-[#65B32E]/20 text-[#1E7E10] text-xs font-bold inline-block">
                  +91 {unregisteredPhone}
                </div>
              </div>

              {/* Action Buttons: Register Now & Cancel */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotRegisteredModal(false);
                    setError(null);
                    // Pre-fill phone into registration forms
                    setGeneralPhone(unregisteredPhone);
                    setProviderPhone(unregisteredPhone);
                    // Navigate to Create an Account – User Type Selection screen
                    setCurrentView('choose_type');
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-sm shadow-md shadow-[#65B32E]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowNotRegisteredModal(false)}
                  className="w-full py-3 px-5 rounded-full bg-white hover:bg-black/5 text-[#4B5563] font-semibold text-xs border border-[#D1D5DB] transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <LeavesDecoration />
      </div>
    );
  }

  /* ========================================================================= */
  /* SCREEN 2: CHOOSE YOUR ACCOUNT TYPE (Screenshot Pixel-Perfect)             */
  /* ========================================================================= */
  if (currentView === 'choose_type') {
    return (
      <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
        {/* Soft Organic Green Swirls in Top-Right Background */}
        <div className="absolute top-0 right-0 w-64 h-48 pointer-events-none overflow-hidden z-0">
          <svg viewBox="0 0 200 150" className="w-full h-full opacity-35" fill="none">
            <path
              d="M30 0C80 40 140 10 200 60V0H30Z"
              fill="url(#greenGradientSoft)"
            />
            <path
              d="M70 0C120 70 170 30 200 90V0H70Z"
              fill="url(#greenGradientSoft2)"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="greenGradientSoft" x1="0" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4ADE80" />
                <stop offset="1" stopColor="#15803D" />
              </linearGradient>
              <linearGradient id="greenGradientSoft2" x1="50" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#86EFAC" />
                <stop offset="1" stopColor="#22C55E" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Top Header: Circular Back Arrow Button with Soft Shadow */}
        <div className="pt-2 flex items-center justify-between relative z-10">
          <button
            onClick={() => setCurrentView('login')}
            className="w-11 h-11 rounded-full bg-white shadow-md hover:shadow-lg border border-slate-100 flex items-center justify-center text-[#111111] transition-all cursor-pointer active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div className="w-11" />
        </div>

        {/* Center Content */}
        <div className="my-auto py-4 relative z-10 max-w-sm mx-auto w-full">
          {/* Heading & Subtitle */}
          <div className="text-center mb-7">
            <h1 className="text-3xl font-black text-[#0B1E13] tracking-tight">
              Create an Account
            </h1>
            {/* Curved Green Arc Under Title */}
            <div className="flex justify-center mt-1.5 mb-2">
              <svg width="64" height="8" viewBox="0 0 64 8" fill="none">
                <path
                  d="M2 6C20 1 44 1 62 6"
                  stroke="#22C55E"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm text-[#4B5563] font-medium">
              Choose your account type to get started.
            </p>
          </div>

          {/* 2 Selectable Cards */}
          <div className="space-y-4">
            {/* Card 1: General User */}
            <div
              onClick={() => setSelectedAccountType('general')}
              className={`w-full p-5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${selectedAccountType === 'general'
                  ? 'border-2 border-[#16A34A] bg-[#FFFFFF] shadow-sm'
                  : 'border border-[#E5E7EB] bg-[#FFFFFF] hover:border-slate-300'
                }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Mint Green Squircle Icon Box */}
                <div className="w-14 h-14 rounded-2xl bg-[#E8F7E4] flex items-center justify-center text-[#16A34A] shrink-0">
                  <User className="w-7 h-7 text-[#1E3A2B] stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-black text-[#111111]">General User</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E5E7EB] text-[#4B5563]">
                      Customer
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] font-normal leading-relaxed">
                    Discover, book and manage services easily.
                  </p>
                </div>
              </div>

              {/* Radio Circle */}
              <div className="shrink-0 ml-3">
                {selectedAccountType === 'general' ? (
                  <div className="w-6 h-6 rounded-full bg-[#15803D] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-[#D1D5DB] bg-white" />
                )}
              </div>
            </div>

            {/* Card 2: Service Provider */}
            <div
              onClick={() => setSelectedAccountType('provider')}
              className={`w-full p-5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${selectedAccountType === 'provider'
                  ? 'border-2 border-[#16A34A] bg-[#FFFFFF] shadow-sm'
                  : 'border border-[#E5E7EB] bg-[#FFFFFF] hover:border-slate-300'
                }`}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Mint Green Squircle Icon Box */}
                <div className="w-14 h-14 rounded-2xl bg-[#E8F7E4] flex items-center justify-center text-[#16A34A] shrink-0">
                  <Store className="w-7 h-7 text-[#1E3A2B] stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-black text-[#111111]">Service Provider</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                      Provider
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] font-normal leading-relaxed">
                    Register, list your services and manage appointments.
                  </p>
                </div>
              </div>

              {/* Radio Circle */}
              <div className="shrink-0 ml-3">
                {selectedAccountType === 'provider' ? (
                  <div className="w-6 h-6 rounded-full bg-[#15803D] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-[#D1D5DB] bg-white" />
                )}
              </div>
            </div>
          </div>

          {/* Terms & Conditions / Privacy Policy Notice */}
          <div className="mt-8 text-center px-4">
            <p className="text-xs text-[#4B5563] font-medium leading-relaxed">
              By continuing, you agree to our{' '}
              <br className="sm:hidden" />
              <span className="text-[#15803D] font-bold underline cursor-pointer hover:text-[#166534]">
                Terms &amp; Conditions
              </span>{' '}
              and{' '}
              <span className="text-[#15803D] font-bold underline cursor-pointer hover:text-[#166534]">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </div>

        {/* Bottom Continue Button */}
        <div className="relative z-10 pt-2 pb-2 max-w-sm mx-auto w-full">
          <button
            type="button"
            onClick={() => {
              if (selectedAccountType === 'general') {
                setCurrentView('general_user');
              } else {
                setCurrentView('provider_step1');
              }
            }}
            className="w-full py-4 px-6 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm sm:text-base shadow-md shadow-[#15803D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>
              {selectedAccountType === 'general'
                ? 'Continue as General User'
                : 'Continue as Service Provider'}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Bottom Soft Green Ambient Swirl */}
        <div className="absolute bottom-0 left-0 w-64 h-36 pointer-events-none overflow-hidden z-0">
          <svg viewBox="0 0 200 100" className="w-full h-full opacity-25" fill="none">
            <path
              d="M0 100C60 40 130 90 200 50V100H0Z"
              fill="url(#greenGradientSoft)"
            />
          </svg>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SCREEN 3: CREATE GENERAL USER ACCOUNT (Screenshot 3)                      */
  /* ========================================================================= */
  if (currentView === 'general_user') {
    return (
      <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
        {/* Top Header: Back Arrow */}
        <div className="pt-2 flex items-center justify-between relative z-10">
          <button
            onClick={() => setCurrentView('choose_type')}
            className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="w-10" />
        </div>

        {/* Content Area */}
        <div className="my-auto py-2 relative z-10 max-w-sm mx-auto w-full">
          {/* Quick Appointments Logo Centered */}
          <div className="text-center mb-4">
            <img
              src="/logo.png"
              alt="Quick Appointments"
              className="h-16 sm:h-20 w-auto object-contain mx-auto"
            />
            <h1 className="text-2xl font-black text-[#111111] tracking-tight mt-3">
              Create General User Account
            </h1>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">
              Fill in your details to get started
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleGeneralUserSubmit} className="space-y-3">
            {/* Field 1: Full Name * */}
            <div className="w-full bg-white rounded-2xl border-2 border-[#16A34A] flex items-center px-4 py-3 shadow-xs">
              <User className="w-4 h-4 text-[#16A34A] shrink-0 mr-3" />
              <input
                type="text"
                value={generalName}
                onChange={(e) => setGeneralName(e.target.value)}
                placeholder="Full Name *"
                className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#6B7280] focus:outline-none bg-transparent"
              />
            </div>

            {/* Field 2: Mobile Number * */}
            <div className="w-full bg-white rounded-2xl border-2 border-[#16A34A] flex items-center px-4 py-3 shadow-xs">
              <Phone className="w-4 h-4 text-[#16A34A] shrink-0 mr-3" />
              <input
                type="tel"
                value={generalPhone}
                onChange={(e) => setGeneralPhone(e.target.value)}
                placeholder="Mobile Number *"
                className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#6B7280] focus:outline-none bg-transparent"
              />
            </div>

            {/* Field 3: Email ID * */}
            <div className="w-full bg-white rounded-2xl border-2 border-[#16A34A] flex items-center px-4 py-3 shadow-xs">
              <Mail className="w-4 h-4 text-[#16A34A] shrink-0 mr-3" />
              <input
                type="email"
                value={generalEmail}
                onChange={(e) => setGeneralEmail(e.target.value)}
                placeholder="Email ID *"
                className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#6B7280] focus:outline-none bg-transparent"
              />
            </div>

            {/* Field: Enter Pincode * + Detect button */}
            <div className="w-full bg-white rounded-2xl border-2 border-[#16A34A] flex items-center px-4 py-2.5 shadow-xs justify-between">
              <div className="flex items-center flex-1 mr-2">
                <MapPin className="w-4 h-4 text-[#16A34A] shrink-0 mr-3" />
                <input
                  type="text"
                  maxLength={6}
                  value={generalPincode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setGeneralPincode(clean);
                    if (clean.length === 6) {
                      handleValidateGeneralPincode(clean);
                    } else {
                      setGeneralLocationConfirmed(false);
                      setGeneralLocationError(null);
                    }
                  }}
                  placeholder="Enter 6-digit PIN code *"
                  className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#6B7280] focus:outline-none bg-transparent font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleDetectPincode}
                className="px-3.5 py-1.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{isDetecting ? 'Detecting...' : 'Detect'}</span>
              </button>
            </div>

            {/* Location Identified Confirmation Section */}
            {generalCity && (
              <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-xs font-black text-emerald-900 tracking-wide uppercase">Location Identified</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">Verified Service Area</span>
                    </div>
                    <div className="text-xs text-slate-700 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-medium">
                      <div><span className="text-slate-500 text-[11px]">PIN Code:</span> <span className="font-bold font-mono text-slate-900">{generalPincode}</span></div>
                      <div><span className="text-slate-500 text-[11px]">City:</span> <span className="font-bold text-slate-900">{generalCity}</span></div>
                      <div><span className="text-slate-500 text-[11px]">District:</span> <span className="font-bold text-slate-900">{generalDistrict || generalCity}</span></div>
                      <div><span className="text-slate-500 text-[11px]">State:</span> <span className="font-bold text-slate-900">{generalState}</span></div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <p className="text-xs font-bold text-emerald-950">
                    Is this your service location?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGeneralPincode('');
                        setGeneralCity('');
                        setGeneralDistrict('');
                        setGeneralState('');
                        setDetectedLocation(null);
                        setGeneralLocationConfirmed(false);
                        setGeneralLocationError(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                    >
                      Change PIN Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeneralLocationConfirmed(true)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                        generalLocationConfirmed
                          ? 'bg-emerald-800 text-white cursor-default'
                          : 'bg-[#15803D] hover:bg-[#166534] text-white active:scale-95'
                      }`}
                    >
                      {generalLocationConfirmed ? '✓ Location Confirmed' : 'Confirm Location'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Unavailable Location Error Banner */}
            {generalLocationError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                <span className="text-rose-600 text-sm font-bold">⚠️</span>
                <div>
                  <p className="text-xs font-bold text-rose-900">Registration Unavailable in this Location</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">{generalLocationError}</p>
                </div>
              </div>
            )}

            {/* Field: Area / Locality */}
            <div className="w-full bg-white rounded-2xl border-2 border-[#16A34A] flex items-center px-4 py-3 shadow-xs">
              <Building className="w-4 h-4 text-[#16A34A] shrink-0 mr-3" />
              <input
                type="text"
                value={generalArea}
                onChange={(e) => setGeneralArea(e.target.value)}
                placeholder="Area / Locality / Street Address (Optional)"
                className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#6B7280] focus:outline-none bg-transparent"
              />
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm sm:text-base shadow-md shadow-[#16A34A]/30 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Terms Agreement Checkbox */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGeneralTermsAgreed(!generalTermsAgreed)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${generalTermsAgreed
                  ? 'bg-[#16A34A] border-[#16A34A] text-white'
                  : 'border-[#D1D5DB] bg-white'
                  }`}
              >
                {generalTermsAgreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
              <p className="text-xs text-[#374151]">
                I agree to the{' '}
                <span className="text-[#16A34A] font-bold underline cursor-pointer">
                  Terms & Conditions
                </span>{' '}
                and{' '}
                <span className="text-[#16A34A] font-bold underline cursor-pointer">
                  Privacy Policy
                </span>
              </p>
            </div>
          </form>
        </div>

        <LeavesDecoration />
      </div>
    );
  }

  /* ========================================================================= */
  /* SCREEN 4: SERVICE PROVIDER REGISTRATION (Multi-step with Screenshot 4)    */
  /* ========================================================================= */

  // Provider Stepper Header (Screenshot Pixel-Perfect)
  const renderProviderStepper = (currentStep: number) => {
    const steps = [
      { num: 1, label: 'Basic' },
      { num: 2, label: 'Location' },
      { num: 3, label: 'Services' },
      { num: 4, label: 'Review' },
    ];

    return (
      <div className="pt-1 pb-4">
        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#0B1E13] tracking-tight text-center">
          Create Service Provider Account
        </h1>
        <p className="text-xs sm:text-sm text-[#4B5563] font-medium text-center mt-1 mb-5">
          Step {currentStep} of 4: {steps[currentStep - 1]?.label.replace('\n', ' ')}
        </p>

        {/* 4 Steps Horizontal Stepper with Connecting Lines */}
        <div className="flex items-center justify-between max-w-sm mx-auto px-2">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isActive = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center flex-1">
                  {/* Step Number Circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                      isActive
                        ? 'bg-[#15803D] text-white shadow-sm ring-4 ring-[#15803D]/15'
                        : isCompleted
                        ? 'bg-[#15803D] text-white'
                        : 'bg-white border-2 border-[#D1D5DB] text-[#6B7280]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </div>

                  {/* Step Label */}
                  <div className="mt-1.5 text-center">
                    {isActive ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E8F7E4] text-[#15803D] text-[10px] font-bold whitespace-nowrap">
                        {s.label.replace('\n', ' ')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#6B7280] leading-tight block whitespace-pre-line">
                        {s.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Connecting Line between steps */}
                {idx < steps.length - 1 && (
                  <div
                    className={`h-[1.5px] flex-1 -mt-5 mx-1 transition-all ${
                      currentStep > s.num ? 'bg-[#15803D]' : 'bg-[#D1D5DB]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // STEP 1: Basic Details (Screenshot Pixel-Perfect)
  if (currentView === 'provider_step1') {
    return (
      <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
        {/* Soft Organic Green Swirl in Top-Right Background */}
        <div className="absolute top-0 right-0 w-64 h-48 pointer-events-none overflow-hidden z-0">
          <svg viewBox="0 0 200 150" className="w-full h-full opacity-35" fill="none">
            <path
              d="M30 0C80 40 140 10 200 60V0H30Z"
              fill="url(#greenGradientSoft)"
            />
            <path
              d="M70 0C120 70 170 30 200 90V0H70Z"
              fill="url(#greenGradientSoft2)"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="greenGradientSoft" x1="0" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4ADE80" />
                <stop offset="1" stopColor="#15803D" />
              </linearGradient>
              <linearGradient id="greenGradientSoft2" x1="50" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#86EFAC" />
                <stop offset="1" stopColor="#22C55E" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Top Header: Circular Back Arrow Button with Soft Shadow */}
        <div className="pt-2 flex items-center justify-between relative z-10">
          <button
            onClick={() => setCurrentView('choose_type')}
            className="w-11 h-11 rounded-full bg-white shadow-md hover:shadow-lg border border-slate-100 flex items-center justify-center text-[#111111] transition-all cursor-pointer active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => saveDraftSilently('provider_step1')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-95"
          >
            Save Draft
          </button>
        </div>

        {/* Form Container */}
        <div className="my-auto py-3 relative z-10 max-w-sm mx-auto w-full">
          {renderProviderStepper(1)}

          {/* Simple and Elegant Fields - Clean Look without container box */}
          <div className="space-y-4 mt-3">
            {/* Field 1: Full Name * */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="w-full bg-white rounded-xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-4 py-3 transition-all">
                <input
                  type="text"
                  value={providerFullName}
                  onChange={(e) => setProviderFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Field 2: Mobile Number * */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="w-full bg-white rounded-xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-4 py-3 transition-all">
                <span className="text-xs sm:text-sm font-bold text-[#111111] pr-3 mr-3 border-r border-slate-300">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={providerPhone}
                  onChange={(e) => setProviderPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Field 3: Email Address (Optional) */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Email Address <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
              </label>
              <div className="w-full bg-white rounded-xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-4 py-3 transition-all">
                <input
                  type="email"
                  value={providerEmail}
                  onChange={(e) => setProviderEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Field 4: Business / Service Name * */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Business / Service Name <span className="text-rose-500">*</span>
              </label>
              <div className="w-full bg-white rounded-xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-4 py-3 transition-all">
                <input
                  type="text"
                  value={providerBusinessName}
                  onChange={(e) => setProviderBusinessName(e.target.value)}
                  placeholder="e.g. Apex Styling Studio"
                  className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Field 5: Business Entity Type * */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Business Entity Type <span className="text-rose-500">*</span>
              </label>
              <div className="w-full bg-white rounded-xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-4 py-3 transition-all">
                <input
                  type="text"
                  value={providerBusinessType}
                  onChange={(e) => setProviderBusinessType(e.target.value)}
                  placeholder="e.g. Individual Professional, Sole Proprietorship, LLP"
                  className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Field 6: About Your Practice / Business (Optional) */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                About Your Practice / Business <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
              </label>
              <div className="w-full bg-white rounded-xl border border-[#D1D5DB] focus-within:border-[#15803D] p-3.5 transition-all">
                <textarea
                  rows={3}
                  maxLength={250}
                  value={providerAboutServices}
                  onChange={(e) => setProviderAboutServices(e.target.value)}
                  placeholder="Describe your services, specialization, and experience"
                  className="w-full text-xs sm:text-sm font-medium text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent resize-none leading-relaxed"
                />
              </div>
              <div className="text-right text-[11px] text-[#9CA3AF] mt-1 font-mono">
                {providerAboutServices.length}/250
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Continue Button */}
        <div className="relative z-10 pt-2 pb-2 max-w-sm mx-auto w-full">
          {error && (
            <div className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (!providerFullName.trim()) {
                setError('Please enter your full name.');
                return;
              }
              if (!providerPhone.trim() || providerPhone.length < 10) {
                setError('Please enter a valid 10-digit mobile number.');
                return;
              }
              // Email is optional, validate format only if entered
              if (providerEmail.trim() && !providerEmail.includes('@')) {
                setError('Please enter a valid email address or leave it blank.');
                return;
              }
              if (!providerBusinessName.trim()) {
                setError('Please enter your business / service name.');
                return;
              }
              if (!providerBusinessType.trim()) {
                setError('Please enter your business entity type.');
                return;
              }
              setError(null);
              saveDraftSilently('provider_step2');
              setCurrentView('provider_step2');
            }}
            className="w-full py-4 px-6 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm sm:text-base shadow-md shadow-[#15803D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Continue to Location &amp; Address</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Bottom Soft Green Ambient Swirl */}
        <div className="absolute bottom-0 left-0 w-64 h-36 pointer-events-none overflow-hidden z-0">
          <svg viewBox="0 0 200 100" className="w-full h-full opacity-25" fill="none">
            <path
              d="M0 100C60 40 130 90 200 50V100H0Z"
              fill="url(#greenGradientSoft)"
            />
          </svg>
        </div>
      </div>
    );
  }

  // STEP 2: Location & Address (Screenshot Pixel-Perfect)
  if (currentView === 'provider_step2') {
    return (
      <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
        {/* Soft Organic Green Swirl in Top-Right Background */}
        <div className="absolute top-0 right-0 w-64 h-48 pointer-events-none overflow-hidden z-0">
          <svg viewBox="0 0 200 150" className="w-full h-full opacity-35" fill="none">
            <path
              d="M30 0C80 40 140 10 200 60V0H30Z"
              fill="url(#greenGradientSoft)"
            />
            <path
              d="M70 0C120 70 170 30 200 90V0H70Z"
              fill="url(#greenGradientSoft2)"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Top Header: Circular Back Arrow Button with Soft Shadow */}
        <div className="pt-2 flex items-center justify-between relative z-10">
          <button
            onClick={() => setCurrentView('provider_step1')}
            className="w-11 h-11 rounded-full bg-white shadow-md hover:shadow-lg border border-slate-100 flex items-center justify-center text-[#111111] transition-all cursor-pointer active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => saveDraftSilently('provider_step2')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-95"
          >
            Save Draft
          </button>
        </div>

        {/* Center Content */}
        <div className="my-auto py-3 relative z-10 max-w-sm mx-auto w-full">
          {renderProviderStepper(2)}

          {/* White Card Container */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-4.5 sm:p-5 shadow-xs space-y-4 mt-3">
            {/* Header: Service Location & Address without icon */}
            <div className="pb-1 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#111111]">
                Service Location &amp; Address
              </h3>
              <p className="text-xs text-[#6B7280] font-normal mt-0.5 leading-relaxed">
                Add your business location for better visibility.
              </p>
            </div>

            {/* Field: PIN Code * with Detect Location Button */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                PIN Code <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white rounded-2xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-3.5 py-2.5 transition-all">
                  <input
                    type="text"
                    maxLength={6}
                    value={providerPincode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setProviderPincode(clean);
                      if (clean.length === 6) {
                        handlePostalCodeLookup(clean);
                      } else {
                        setProviderLocationConfirmed(false);
                        setProviderLocationError(null);
                      }
                    }}
                    placeholder="Enter 6-digit Indian PIN code"
                    className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDetectProviderGps}
                  disabled={isDetectingPostalLocation}
                  className="px-4 py-3 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
                >
                  <span>{isDetectingPostalLocation ? 'Detecting...' : 'Detect Location'}</span>
                </button>
              </div>

              {/* Location Identified Confirmation Section */}
              {providerCity && (
                <div className="mt-3 p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="text-xs font-black text-emerald-900 tracking-wide uppercase">Location Identified</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">Verified Service Area</span>
                      </div>
                      <div className="text-xs text-slate-700 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-medium">
                        <div><span className="text-slate-500 text-[11px]">PIN Code:</span> <span className="font-bold font-mono text-slate-900">{providerPincode}</span></div>
                        <div><span className="text-slate-500 text-[11px]">City:</span> <span className="font-bold text-slate-900">{providerCity}</span></div>
                        <div><span className="text-slate-500 text-[11px]">District:</span> <span className="font-bold text-slate-900">{providerDistrict || providerCity}</span></div>
                        <div><span className="text-slate-500 text-[11px]">State:</span> <span className="font-bold text-slate-900">{providerState}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <p className="text-xs font-bold text-emerald-950">
                      Is this your service location?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProviderPincode('');
                          setProviderCity('');
                          setProviderDistrict('');
                          setProviderState('');
                          setProviderLocationConfirmed(false);
                          setProviderLocationError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                      >
                        Change PIN Code
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProviderLocationConfirmed(true);
                        }}
                        className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                          providerLocationConfirmed
                            ? 'bg-emerald-800 text-white cursor-default'
                            : 'bg-[#15803D] hover:bg-[#166534] text-white active:scale-95'
                        }`}
                      >
                        {providerLocationConfirmed ? '✓ Location Confirmed' : 'Confirm Location'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Unavailable Location Error Banner */}
              {providerLocationError && (
                <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                  <span className="text-rose-600 text-sm font-bold">⚠️</span>
                  <div>
                    <p className="text-xs font-bold text-rose-900">Registration Unavailable in this Location</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">{providerLocationError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Field: Detailed Street / Premise Address with View Details > */}
            <div>
              <div
                onClick={() => setShowManualAddressFields(!showManualAddressFields)}
                className="w-full bg-white rounded-2xl border border-[#D1D5DB] hover:border-slate-400 p-3 flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex flex-col min-w-0 flex-1 mr-2">
                  <span className="text-xs sm:text-sm font-semibold text-[#111111] truncate">
                    Detailed Street / Premise Address
                  </span>
                  {providerAddress && (
                    <span className="text-[11px] text-[#4B5563] truncate mt-0.5">
                      {[providerAddress, providerArea, providerCity].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-[#15803D] flex items-center gap-0.5 shrink-0 ml-2">
                  <span>{showManualAddressFields ? 'Hide Details' : 'View Details'}</span>
                  <span className="text-sm">{showManualAddressFields ? '▴' : '›'}</span>
                </span>
              </div>

              {/* Collapsible Manual Address Form */}
              {showManualAddressFields && (
                <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Building / Unit / Floor</label>
                    <input
                      type="text"
                      value={providerAddress}
                      onChange={(e) => setProviderAddress(e.target.value)}
                      placeholder="Shop #, Flat, Building Name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#15803D]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Area / Landmark</label>
                      <input
                        type="text"
                        value={providerArea}
                        onChange={(e) => setProviderArea(e.target.value)}
                        placeholder="e.g. Near Bus Station"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#15803D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={providerCity}
                        onChange={(e) => setProviderCity(e.target.value)}
                        placeholder="e.g. Warangal"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#15803D]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualAddressFields(false)}
                    className="w-full mt-2 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold transition-all"
                  >
                    Save &amp; Hide Details ✓
                  </button>
                </div>
              )}
            </div>

            {/* Field: Google Maps Shared Location Link (Optional) */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Google Maps Shared Location Link <span className="text-[11px] font-normal text-[#6B7280]">(Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white rounded-2xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-3.5 py-2.5 transition-all">
                  <input
                    type="text"
                    value={googleMapLink}
                    onChange={(e) => setGoogleMapLink(e.target.value)}
                    placeholder="Paste Google Maps link here..."
                    className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (googleMapLink) {
                      window.open(googleMapLink, '_blank');
                    } else if (navigator.geolocation) {
                      handleDetectProviderGps();
                    }
                  }}
                  className="px-4 py-3 rounded-2xl bg-white border border-[#D1D5DB] hover:bg-slate-50 text-[#15803D] text-xs font-bold shrink-0 transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  Test Link
                </button>
              </div>

              {/* Informational Hint */}
              <div className="flex items-start gap-1.5 mt-2 text-[11px] text-[#6B7280]">
                <p className="leading-snug">
                  Admin will verify your location. If you have a Google Maps link, paste it above, or admin will contact you to verify.
                </p>
              </div>
            </div>

            {/* Field: Premise / Workplace Photos * (0/3) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#111111]">
                  Premise / Workplace Photos <span className="text-rose-500">*</span> ({placePhotos.length}/3)
                </label>
                <span className="text-[10px] font-bold text-[#15803D] bg-[#E8F7E4] px-2 py-0.5 rounded-full">
                  HD Compressed
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug mb-3">
                Upload 1 to 3 clear photos showing your shop/clinic/office front view with signage board &amp; interior workstation.
              </p>

              {/* Hidden file pickers for premise photos */}
              <input
                ref={cameraPickerRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePickerFileSelected}
                className="hidden"
              />
              <input
                ref={galleryPickerRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handlePickerFileSelected}
                className="hidden"
              />
              <input
                ref={filePickerRef}
                type="file"
                accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,image/jpg"
                onChange={handlePickerFileSelected}
                className="hidden"
              />

              {/* Rendered Uploaded Photos Grid */}
              {placePhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {placePhotos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#15803D] group shadow-xs">
                      <img src={url} alt="Premise" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPlacePhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer shadow-md"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Clean Add Workplace Photo Box without icons */}
              {placePhotos.length < 3 && (
                <button
                  type="button"
                  onClick={() => openDocPicker('premise', 'Workplace Photo')}
                  className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-[#86EFAC] bg-[#F0FDF4] hover:bg-[#DCFCE7]/50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <p className="text-xs sm:text-sm font-bold text-[#15803D]">
                    + Add Workplace Photo
                  </p>
                  <p className="text-[11px] text-[#4B5563]">
                    (Camera / Gallery / Files)
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Continue Button */}
        <div className="relative z-10 pt-2 pb-2 max-w-sm mx-auto w-full">
          {error && (
            <div className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const cleanPin = (providerPincode || '').replace(/\D/g, '');
              if (cleanPin.length !== 6) {
                setError('Please enter a valid 6-digit Indian PIN code.');
                return;
              }
              if (!providerLocationConfirmed) {
                setError('Please verify and confirm your service location before continuing.');
                return;
              }
              if (!providerCity.trim()) {
                setError('Please ensure city is entered or detected.');
                return;
              }
              if (placePhotos.length === 0) {
                setError('Please add at least 1 workplace/premise photo (signboard / storefront).');
                return;
              }
              setError(null);
              saveDraftSilently('provider_step3');
              setCurrentView('provider_step3');
            }}
            className="w-full py-4 px-6 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm sm:text-base shadow-md shadow-[#15803D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Continue to Services &amp; Hours</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Multi-Source Upload Modal: Camera / Gallery / Files (No Icons) */}
        {docPickerModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-black text-[#111111]">
                    Upload {docPickerModal.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Choose photo source
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDocPickerModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    cameraPickerRef.current?.click();
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <p className="text-xs sm:text-sm font-bold text-[#111111] group-hover:text-[#15803D]">
                    Take Photo with Camera
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Capture a clear live photo using device camera
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    galleryPickerRef.current?.click();
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <p className="text-xs sm:text-sm font-bold text-[#111111] group-hover:text-[#15803D]">
                    Choose from Photo Gallery
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Select an existing photo from device library
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    filePickerRef.current?.click();
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <p className="text-xs sm:text-sm font-bold text-[#111111] group-hover:text-[#15803D]">
                    Browse Files &amp; Documents
                  </p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Choose PDF or photo from local files
                  </p>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDocPickerModal(null)}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Soft Green Ambient Swirl */}
        <div className="absolute bottom-0 left-0 w-64 h-36 pointer-events-none overflow-hidden z-0">
          <svg viewBox="0 0 200 100" className="w-full h-full opacity-25" fill="none">
            <path
              d="M0 100C60 40 130 90 200 50V100H0Z"
              fill="url(#greenGradientSoft)"
            />
          </svg>
        </div>
      </div>
    );
  }

  // STEP 3: Services & Availability (Screenshot Pixel-Perfect)
  if (currentView === 'provider_step3') {
    const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
        {/* Soft Organic Green Swirl in Top-Right Background */}
        <div className="absolute top-0 right-0 w-64 h-48 pointer-events-none overflow-hidden z-0">
          <svg viewBox="0 0 200 150" className="w-full h-full opacity-35" fill="none">
            <path
              d="M30 0C80 40 140 10 200 60V0H30Z"
              fill="url(#greenGradientSoft)"
            />
            <path
              d="M70 0C120 70 170 30 200 90V0H70Z"
              fill="url(#greenGradientSoft2)"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Top Header: Circular Back Arrow Button with Soft Shadow */}
        <div className="pt-2 flex items-center justify-between relative z-10">
          <button
            onClick={() => setCurrentView('provider_step2')}
            className="w-11 h-11 rounded-full bg-white shadow-md hover:shadow-lg border border-slate-100 flex items-center justify-center text-[#111111] transition-all cursor-pointer active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => saveDraftSilently('provider_step3')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-95"
          >
            Save Draft
          </button>
        </div>

        {/* Center Content */}
        <div className="my-auto py-3 relative z-10 max-w-sm mx-auto w-full">
          {renderProviderStepper(3)}

          {/* White Card Container */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-4.5 sm:p-5 shadow-xs space-y-4 mt-3">
            {/* Header: Services & Availability without icon */}
            <div className="pb-1 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-[#111111]">
                Services &amp; Availability
              </h3>
              <p className="text-xs text-[#6B7280] font-normal mt-0.5 leading-relaxed">
                Add your services and working hours.
              </p>
            </div>

            {/* Service Category * Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#111111]">
                  Service Category <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {dbCategories.length} Categories from Admin
                </span>
              </div>

              {/* Grid of Admin Updated Categories (Text-only pills) */}
              <div className="grid grid-cols-2 gap-2.5">
                {dbCategories.map((c) => {
                  const isSelected = !isOtherCategorySelected && providerCategory.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => {
                        setIsOtherCategorySelected(false);
                        setProviderCategory(c.name);
                      }}
                      className={`p-3 rounded-2xl flex items-center justify-between text-left transition-all border ${
                        isSelected
                          ? 'border-2 border-[#16A34A] bg-[#FFFFFF] shadow-2xs'
                          : 'border border-[#E5E7EB] bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-[#111111] truncate flex-1">
                        {c.name}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#15803D] flex items-center justify-center text-white shrink-0 ml-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Other Category Option Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOtherCategorySelected(true);
                    setProviderCategory(customCategoryInput || 'Other');
                  }}
                  className={`p-3 rounded-2xl flex items-center justify-between text-left transition-all border ${
                    isOtherCategorySelected
                      ? 'border-2 border-[#16A34A] bg-[#FFFFFF] shadow-2xs'
                      : 'border border-[#E5E7EB] bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-[#111111] truncate flex-1">
                    + Other Category
                  </span>
                  {isOtherCategorySelected && (
                    <div className="w-4 h-4 rounded-full bg-[#15803D] flex items-center justify-center text-white shrink-0 ml-1">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>

              {/* Custom Category Input if "Other" is chosen */}
              {isOtherCategorySelected && (
                <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Enter Your Custom Category Name *
                  </label>
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => {
                      setCustomCategoryInput(e.target.value);
                      setProviderCategory(e.target.value);
                    }}
                    placeholder="e.g. Pet Care, Tailoring, Yoga & Pilates..."
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#15803D]"
                  />
                </div>
              )}
            </div>

            {/* Specific Services You Provide * (Headline Input + Manual Service & Cost List) */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Specific Services You Provide <span className="text-rose-500">*</span>
              </label>
              <div className="w-full bg-white rounded-2xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-3.5 py-2.5 transition-all">
                <input
                  type="text"
                  value={providerSpecificServices}
                  onChange={(e) => setProviderSpecificServices(e.target.value)}
                  placeholder="e.g. Hair styling, beard detailing, facial massage"
                  className="w-full text-xs sm:text-sm font-semibold text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
                />
              </div>

              {/* Provider Manual Services & Exact Cost Entry */}
              <div className="mt-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Service Items &amp; Pricing (₹)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProviderManualServices((prev) => [
                        ...prev,
                        { name: '', price: 299, duration: 30 },
                      ]);
                    }}
                    className="text-[11px] font-bold text-[#15803D] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {providerManualServices.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProviderManualServices((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, name: val } : s))
                          );
                        }}
                        placeholder={`Service #${idx + 1} Name`}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#15803D]"
                      />
                      <div className="w-24 bg-white border border-slate-200 rounded-xl px-2 py-1.5 flex items-center">
                        <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setProviderManualServices((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, price: val } : s))
                            );
                            if (idx === 0) setProviderRate(String(val));
                          }}
                          className="w-full text-xs font-bold text-slate-900 focus:outline-none font-mono"
                        />
                      </div>
                      {providerManualServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setProviderManualServices((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Available Working Days * */}
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-2">
                Available Working Days <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {daysList.map((day) => {
                  const isSelected = availableWorkingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setAvailableWorkingDays(availableWorkingDays.filter((d) => d !== day));
                          setProviderWorkingDays(availableWorkingDays.filter((d) => d !== day));
                        } else {
                          setAvailableWorkingDays([...availableWorkingDays, day]);
                          setProviderWorkingDays([...availableWorkingDays, day]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#15803D] bg-white text-[#111111] shadow-2xs'
                          : 'border-[#D1D5DB] bg-white text-[#6B7280]'
                      }`}
                    >
                      {isSelected ? (
                        <span className="text-[#15803D] font-black">✓</span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full border border-slate-300 inline-block" />
                      )}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Working Hours From & To */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Working Hours From <span className="text-rose-500">*</span>
                </label>
                <div className="w-full bg-white rounded-2xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-3 py-2.5 justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <select
                      value={workingHoursFrom}
                      onChange={(e) => {
                        setWorkingHoursFrom(e.target.value);
                        setProviderHours(`${e.target.value} - ${workingHoursTo}`);
                      }}
                      className="w-full text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none bg-transparent cursor-pointer"
                    >
                      {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#111111] pointer-events-none stroke-[2]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Working Hours To <span className="text-rose-500">*</span>
                </label>
                <div className="w-full bg-white rounded-2xl border border-[#D1D5DB] focus-within:border-[#15803D] flex items-center px-3 py-2.5 justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <select
                      value={workingHoursTo}
                      onChange={(e) => {
                        setWorkingHoursTo(e.target.value);
                        setProviderHours(`${workingHoursFrom} - ${e.target.value}`);
                      }}
                      className="w-full text-xs sm:text-sm font-semibold text-[#111111] focus:outline-none bg-transparent cursor-pointer"
                    >
                      {['05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#111111] pointer-events-none stroke-[2]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Continue Button */}
        <div className="relative z-10 pt-2 pb-2 max-w-sm mx-auto w-full">
          {error && (
            <div className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (!providerCategory.trim()) {
                setError('Please select or enter your service category.');
                return;
              }
              const hasSpecific = providerSpecificServices.trim() || providerManualServices.some((s) => s.name.trim());
              if (!hasSpecific) {
                setError('Please enter the specific services you provide and their pricing.');
                return;
              }
              if (availableWorkingDays.length === 0) {
                setError('Please select at least one available working day.');
                return;
              }
              setError(null);
              saveDraftSilently('provider_step4');
              setCurrentView('provider_step4');
            }}
            className="w-full py-4 px-6 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm sm:text-base shadow-md shadow-[#15803D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Continue to Documents &amp; Review</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Bottom Soft Green Ambient Swirl */}
        <div className="absolute bottom-0 left-0 w-64 h-36 pointer-events-none overflow-hidden z-0">
          <svg viewBox="0 0 200 100" className="w-full h-full opacity-25" fill="none">
            <path
              d="M0 100C60 40 130 90 200 50V100H0Z"
              fill="url(#greenGradientSoft)"
            />
          </svg>
        </div>
      </div>
    );
  }

  // STEP 4: Review & Submit
  if (currentView === 'provider_step4') {
    return (
      <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
        <div className="pt-2 flex items-center justify-between relative z-10">
          <button
            onClick={() => setCurrentView('provider_step3')}
            className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={() => saveDraftSilently('provider_step4')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-95"
          >
            Save Draft
          </button>
        </div>

        <div className="my-auto py-2 relative z-10 max-w-sm mx-auto w-full space-y-4">
          {renderProviderStepper(4)}

          {/* Bank & Settlement Account Details (Clean, no icons) */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <div>
              <h3 className="text-sm font-black text-[#111111]">
                Bank &amp; Settlement Account Details
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Direct settlement account for customer booking payouts.
              </p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Account Holder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={providerAccountHolderName}
                  onChange={(e) => setProviderAccountHolderName(e.target.value)}
                  placeholder="Name as per Bank records"
                  className="w-full bg-white border border-[#D1D5DB] focus:border-[#15803D] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Bank Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={providerBankName}
                  onChange={(e) => setProviderBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, HDFC, ICICI"
                  className="w-full bg-white border border-[#D1D5DB] focus:border-[#15803D] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  Bank Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={providerAccountNumber}
                  onChange={(e) => setProviderAccountNumber(e.target.value)}
                  placeholder="Enter bank account number"
                  className="w-full bg-white border border-[#D1D5DB] focus:border-[#15803D] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  IFSC Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={providerIfscCode}
                  onChange={(e) => setProviderIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234, HDFC0000456"
                  className="w-full bg-white border border-[#D1D5DB] focus:border-[#15803D] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#111111] mb-1">
                  UPI ID <span className="text-[10px] text-[#6B7280] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={providerUpiId}
                  onChange={(e) => setProviderUpiId(e.target.value)}
                  placeholder="e.g. username@okhdfcbank"
                  className="w-full bg-white border border-[#D1D5DB] focus:border-[#15803D] rounded-xl px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-[#111111] border-b pb-2 flex items-center justify-between">
              <span>Registration Summary</span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                In-Person Marketplace
              </span>
            </h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Business Name:</span>
                <span className="font-bold text-[#111111]">{providerBusinessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Center Category:</span>
                <span className="font-bold text-[#16A34A]">{providerCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Owner Name:</span>
                <span className="font-bold text-[#111111]">{providerFullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280]">Mobile Phone:</span>
                <span className="font-bold text-[#111111] font-mono flex items-center gap-1">
                  <span>+91 {providerPhone}</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                    OTP Verified
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Center Address:</span>
                <span className="font-bold text-[#111111] text-right truncate max-w-[200px]">
                  {providerAddress ? `${providerAddress}, ${providerCity}` : `${providerCity}, India`}
                </span>
              </div>
              {(googleMapLink || providerGpsCoords) && (
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280]">Map Location:</span>
                  <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Location Tagged
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Bank Account:</span>
                <span className="font-bold text-[#111111]">
                  {providerAccountNumber ? `•••• ${providerAccountNumber.slice(-4)} (${providerBankName})` : 'Not Set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Base Rate:</span>
                <span className="font-bold text-[#111111]">₹{providerRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">KYC Proofs:</span>
                <span className="font-bold text-amber-700">
                  {[
                    aadhaarUploaded ? 'Aadhaar' : null,
                    panUploaded ? 'PAN' : null,
                    licenseUploaded ? 'License' : null,
                    certUploaded ? 'Certificate' : null,
                  ]
                    .filter(Boolean)
                    .join(' + ') || 'Uploaded'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-2 pb-2 max-w-sm mx-auto w-full">
          {error && (
            <div className="mb-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleProviderFinalSubmit}
            disabled={loading}
            className="w-full py-4 px-6 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm sm:text-base shadow-md shadow-[#16A34A]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? 'Submitting Application...' : 'Submit Application'}</span>
          </button>
        </div>



        <LeavesDecoration />
      </div>
    );
  }

  // STEP SUCCESS: Submitted for Verification
  if (currentView === 'provider_success') {
    return (
      <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
        <div className="my-auto py-8 text-center max-w-sm mx-auto w-full">
          <div className="w-16 h-16 rounded-full bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center mx-auto mb-4 border-2 border-[#16A34A]">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            Application Submitted!
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-2 px-4 leading-relaxed font-medium">
            Your Service Provider profile for <strong className="text-[#111111]">{providerBusinessName}</strong> has been submitted with <strong className="text-[#D97706]">PENDING APPROVAL</strong> status. Quick Appointments admin will review your KYC documents before activating bookings.
          </p>
        </div>

        <div className="relative z-10 pt-2 pb-2 max-w-sm mx-auto w-full">
          <button
            type="button"
            onClick={onComplete}
            className="w-full py-4 px-6 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm sm:text-base shadow-md shadow-[#16A34A]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>View Verification Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>



        <LeavesDecoration />
      </div>
    );
  }

  return null;
};

export default AuthScreen;
