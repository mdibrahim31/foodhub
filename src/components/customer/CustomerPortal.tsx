import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDelivery } from '../../context/DeliveryContext';
import { AddressBookModal } from './AddressBookModal';
import { AuthModal } from '../common/AuthModal';
import { CustomerRestaurantReviewsModal } from './CustomerRestaurantReviewsModal';
import { calculateDistanceKm, calculateDeliveryFee, findZoneForPoint, isPointInZone, parseGoogleMapsLinkOrCoords } from '../../utils/geo';
import { Vendor, Order, MenuItem } from '../../types/database';
import { 
  MapPin, 
  Search, 
  ShoppingBag, 
  Star, 
  Plus, 
  Minus, 
  ChevronRight, 
  Heart,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  UtensilsCrossed,
  Store,
  User,
  Banknote,
  ArrowRight,
  Settings,
  Receipt,
  Gift,
  HelpCircle,
  FileText,
  LogOut,
  LogIn,
  Clock,
  Check,
  X,
  Phone,
  Bike,
  Tag,
  Percent,
  Flame,
  ArrowLeft,
  Info,
  Share2,
  Trash2,
  Maximize2,
  Minimize2,
  Smartphone,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { 
    vendors, 
    menuItems, 
    foodCategories,
    adBanners,
    addresses,
    selectedAddress, 
    settings, 
    cart, 
    cartVendor, 
    addToCart, 
    updateCartQuantity, 
    removeFromCart,
    clearCart,
    placeOrder,
    orders,
    currentUser,
    currentCustomer,
    updateCustomerProfile,
    requestCustomerProfileOtp,
    verifyCustomerProfileOtp,
    customerRespondToPrepTime,
    logoutUser,
    loginUser,
    registerCustomer,
    requestCustomerSignupOtp,
    verifyCustomerSignupOtp,
    zones,
    reviews,
    addOrderReview,
    favorites,
    toggleFavorite,
    divisions,
    cityAreas,
    selectedArea,
    setSelectedArea,
    updateVendor
  } = useDelivery();

  const [isChooseAreaModalOpen, setIsChooseAreaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Customer Signup OTP Flow States
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [pendingSignup, setPendingSignup] = useState<{ id: string; name: string; phone: string; password: string } | null>(null);
  const [signupOtpInput, setSignupOtpInput] = useState('');
  const [signupOtpTimer, setSignupOtpTimer] = useState(60);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpAlert, setOtpAlert] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // OTP Countdown Timer
  useEffect(() => {
    let t: any;
    if (signupStep === 'otp' && signupOtpTimer > 0) {
      t = setInterval(() => setSignupOtpTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    }
    return () => clearInterval(t);
  }, [signupStep, signupOtpTimer]);

  // Persistent navigation and views so refreshing never resets to home
  const [activeBottomNav, setActiveBottomNavState] = useState<'food' | 'grocery' | 'carts' | 'orders' | 'account'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foodiplace_customer_bottom_nav') as 'food' | 'grocery' | 'carts' | 'orders' | 'account';
      if (['food', 'grocery', 'carts', 'orders', 'account'].includes(saved)) return saved;
    }
    return 'food';
  });

  const setActiveBottomNav = (nav: 'food' | 'grocery' | 'carts' | 'orders' | 'account') => {
    setActiveBottomNavState(nav);
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodiplace_customer_bottom_nav', nav);
    }
  };

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCustomerLoginModalOpen, setIsCustomerLoginModalOpen] = useState(false);
  const [isViewingCartDetail, setIsViewingCartDetail] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Account Page States
  const [accountSubView, setAccountSubViewState] = useState<'none' | 'orders' | 'favourites'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foodiplace_customer_account_subview') as 'none' | 'orders' | 'favourites';
      if (['none', 'orders', 'favourites'].includes(saved)) return saved;
    }
    return 'none';
  });
  const [favTab, setFavTab] = useState<'restaurants' | 'shops'>('restaurants');

  const setAccountSubView = (action: React.SetStateAction<'none' | 'orders' | 'favourites'>) => {
    setAccountSubViewState(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (typeof window !== 'undefined') {
        localStorage.setItem('foodiplace_customer_account_subview', next);
      }
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'popular' | 'rating' | 'distance' | 'new'>('popular');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isFilterSettingsOpen, setIsFilterSettingsOpen] = useState(false);
  const [isRating4PlusOnly, setIsRating4PlusOnly] = useState(false);
  const [isNewOnly, setIsNewOnly] = useState(false);
  const [activeCuisineFilter, setActiveCuisineFilter] = useState('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const isVendorNew = (v: Vendor) => {
    if (!v.created_at) return true; // Sample vendors count as new if created_at is omitted
    const createdTime = new Date(v.created_at).getTime();
    if (isNaN(createdTime)) return true;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    return (Date.now() - createdTime) <= thirtyDaysMs;
  };
  const [activeRestaurantTypeFilter, setActiveRestaurantTypeFilter] = useState('All');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('All');

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRestaurantReviewsOpen, setIsRestaurantReviewsOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  const [selectedMentionedDishes, setSelectedMentionedDishes] = useState<string[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const docEl = document.documentElement as any;
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  };

  // Foodpanda Style Menu Item Modal States
  const [selectedMenuItemForModal, setSelectedMenuItemForModal] = useState<MenuItem | null>(null);
  const [selectedModalVariations, setSelectedModalVariations] = useState<Record<string, import('../../context/DeliveryContext').CartItemOption>>({});
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalSpecialInstructions, setModalSpecialInstructions] = useState('');
  const [isUnavailPopupOpen, setIsUnavailPopupOpen] = useState(false);
  const [unavailPreference, setUnavailPreference] = useState<'remove' | 'call'>('remove');
  const modalScrollContainerRef = useRef<HTMLDivElement>(null);

  const isValidDescription = (desc?: string | null): boolean => {
    if (!desc || typeof desc !== 'string') return false;
    const trimmed = desc.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    return lower !== 'false' && lower !== 'null' && lower !== 'undefined' && lower !== 'true';
  };

  useEffect(() => {
    if (selectedMenuItemForModal && modalScrollContainerRef.current) {
      modalScrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedMenuItemForModal]);

  const getItemEffectiveVariations = (dish?: MenuItem | null): import('../../types/database').MenuVariationGroup[] => {
    if (!dish) return [];

    // 1. Variations field on MenuItem
    if (dish.variations && Array.isArray(dish.variations) && dish.variations.length > 0) {
      return dish.variations;
    }

    // 2. Fallback: portion_options JSON column on MenuItem
    if (dish.portion_options && Array.isArray(dish.portion_options) && dish.portion_options.length > 0) {
      return [{
        id: 'portion-group',
        name: 'Portion / Size',
        type: 'single',
        required: true,
        options: dish.portion_options.map(po => ({
          id: po.id || `opt-${po.name}`,
          name: po.name,
          price: Number(po.price) || 0
        }))
      }];
    }

    return [];
  };

  const handleOpenMenuItemModal = (dish: MenuItem) => {
    setSelectedMenuItemForModal(dish);
    setModalQuantity(1);
    setModalSpecialInstructions('');

    const initialVars: Record<string, import('../../context/DeliveryContext').CartItemOption> = {};
    const groups = getItemEffectiveVariations(dish);
    groups.forEach(g => {
      if (g.options && g.options.length > 0) {
        if (g.required || g.type === 'single') {
          const defaultOpt = g.options.find(o => (Number(o.price) || 0) === 0) || g.options[0];
          initialVars[g.id || g.name] = {
            groupName: g.name,
            optionName: defaultOpt.name,
            price: Number(defaultOpt.price) || 0
          };
        }
      }
    });
    setSelectedModalVariations(initialVars);
  };

  const isPortionGroup = (
    group: import('../../types/database').MenuVariationGroup, 
    allGroups: import('../../types/database').MenuVariationGroup[]
  ): boolean => {
    const gName = (group.name || '').toLowerCase();
    if (
      gName.includes('portion') || 
      gName.includes('size') || 
      gName.includes('সাইজ') || 
      gName.includes('পরিমাণ')
    ) {
      return true;
    }
    const hasExplicitPortionGroup = allGroups.some(g => {
      const n = (g.name || '').toLowerCase();
      return n.includes('portion') || n.includes('size') || n.includes('সাইজ') || n.includes('পরিমাণ');
    });
    if (hasExplicitPortionGroup) {
      return false;
    }
    return allGroups.length === 1 && group.type === 'single';
  };

  const calculatedModalUnitPrice = useMemo(() => {
    if (!selectedMenuItemForModal) return 0;
    const effectiveVariations = getItemEffectiveVariations(selectedMenuItemForModal);
    
    let portionPrice: number | null = null;
    let extraPriceTotal = 0;

    effectiveVariations.forEach(group => {
      const groupKey = group.id || group.name;
      const selectedVal = selectedModalVariations[groupKey];
      const isPortion = isPortionGroup(group, effectiveVariations);

      if (selectedVal && selectedVal.price !== undefined && selectedVal.price !== null) {
        const p = Number(selectedVal.price);
        if (isPortion) {
          portionPrice = p;
        } else {
          extraPriceTotal += p;
        }
      }
    });

    const basePrice = portionPrice !== null ? portionPrice : (Number(selectedMenuItemForModal.price) || 0);
    return basePrice + extraPriceTotal;
  }, [selectedMenuItemForModal, selectedModalVariations]);

  const calculatedModalTotal = calculatedModalUnitPrice * modalQuantity;

  const handleConfirmAddToCartFromModal = () => {
    if (!selectedMenuItemForModal || !selectedVendorForMenu) return;
    addToCart(
      selectedMenuItemForModal,
      selectedVendorForMenu,
      modalQuantity,
      Object.values(selectedModalVariations),
      modalSpecialInstructions,
      calculatedModalUnitPrice
    );
    setSelectedMenuItemForModal(null);
  };

  // Filter orders strictly for the active customer account (Only show the logged-in customer's orders)
  const myOrders = useMemo(() => {
    if (!currentUser || currentUser.role !== 'customer') {
      return [];
    }
    const currentCustId = currentCustomer?.id || currentUser.reference_id || currentUser.id;
    const currentCustPhone = (currentUser.phone || currentCustomer?.phone || '').replace(/\D/g, '');

    return orders.filter(ord => {
      if (ord.customer_id && (ord.customer_id === currentCustId || ord.customer_id === currentUser.id)) {
        return true;
      }
      if (currentCustPhone && ord.customer_phone) {
        const orderPhone = ord.customer_phone.replace(/\D/g, '');
        if (orderPhone && orderPhone === currentCustPhone) {
          return true;
        }
      }
      return false;
    });
  }, [orders, currentUser, currentCustomer]);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [initialPhone, setInitialPhone] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveFeedback, setProfileSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Profile OTP Verification states
  const [profileOtpStep, setProfileOtpStep] = useState<'idle' | 'otp_required'>('idle');
  const [profileOtpCode, setProfileOtpCode] = useState('');
  const [profileOtpId, setProfileOtpId] = useState('');
  const [profileTargetPhone, setProfileTargetPhone] = useState('');
  const [profileOtpTimer, setProfileOtpTimer] = useState(0);

  useEffect(() => {
    if (profileOtpTimer <= 0) return;
    const interval = setInterval(() => {
      setProfileOtpTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [profileOtpTimer]);

  const accountDisplayName = currentCustomer?.name || currentUser?.name || 'Customer';

  const openEditProfile = () => {
    const curName = currentCustomer?.name || currentUser?.name || '';
    const curPhone = currentCustomer?.phone || currentUser?.phone || '';
    const curPass = currentCustomer?.password || '';
    setFormName(curName);
    setFormPhone(curPhone);
    setFormPassword(curPass);
    setInitialPhone(curPhone);
    setInitialPassword(curPass);
    setShowPassword(false);
    setProfileOtpStep('idle');
    setProfileOtpCode('');
    setProfileOtpId('');
    setProfileSaveFeedback(null);
    setIsEditProfileOpen(true);
  };

  const openSettingsModal = () => {
    const curName = currentCustomer?.name || currentUser?.name || '';
    const curPhone = currentCustomer?.phone || currentUser?.phone || '';
    const curPass = currentCustomer?.password || '';
    setFormName(curName);
    setFormPhone(curPhone);
    setFormPassword(curPass);
    setInitialPhone(curPhone);
    setInitialPassword(curPass);
    setShowPassword(false);
    setProfileOtpStep('idle');
    setProfileOtpCode('');
    setProfileOtpId('');
    setProfileSaveFeedback(null);
    setIsSettingsModalOpen(true);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = formName.trim();
    const trimmedPhone = formPhone.trim();
    const trimmedPassword = formPassword.trim();

    if (!trimmedName) {
      setProfileSaveFeedback({ type: 'error', message: 'Please enter a valid display name.' });
      return;
    }
    if (!trimmedPhone) {
      setProfileSaveFeedback({ type: 'error', message: 'Please enter a valid mobile number.' });
      return;
    }

    const cleanCurrentPhone = trimmedPhone.replace(/\D/g, '');
    const cleanInitialPhone = initialPhone.replace(/\D/g, '');
    const isPhoneChanged = cleanInitialPhone.length > 0 && cleanCurrentPhone !== cleanInitialPhone;
    const isPasswordChanged = trimmedPassword.length > 0 && trimmedPassword !== initialPassword;

    // If Phone or Password changed: OTP IS MANDATORY
    if (isPhoneChanged || isPasswordChanged) {
      setIsSavingProfile(true);
      setProfileSaveFeedback(null);
      // If phone changed, verify the new phone number; otherwise send to current phone
      const targetPhone = isPhoneChanged ? trimmedPhone : (initialPhone || trimmedPhone);

      try {
        const otpRes = await requestCustomerProfileOtp(targetPhone);
        if (otpRes.success && otpRes.otpId) {
          setProfileOtpId(otpRes.otpId);
          setProfileTargetPhone(targetPhone);
          setProfileOtpStep('otp_required');
          setProfileOtpCode('');
          setProfileOtpTimer(30);
          setProfileSaveFeedback(null);
        } else {
          setProfileSaveFeedback({ type: 'error', message: otpRes.message || 'Failed to send OTP code to your number. Please try again.' });
        }
      } catch (err: any) {
        setProfileSaveFeedback({ type: 'error', message: err?.message || 'Error requesting OTP.' });
      } font-medium {
        setIsSavingProfile(false);
      }
      return;
    }

    // ONLY Name changed: Update without OTP!
    setIsSavingProfile(true);
    setProfileSaveFeedback(null);

    try {
      const res = await updateCustomerProfile({
        name: trimmedName,
        phone: trimmedPhone,
        password: initialPassword || trimmedPassword,
      });

      if (res.success) {
        setProfileSaveFeedback({ type: 'success', message: '✅ Name updated successfully!' });
        setTimeout(() => {
          setIsEditProfileOpen(false);
          setIsSettingsModalOpen(false);
          setProfileSaveFeedback(null);
        }, 800);
      } else {
        setProfileSaveFeedback({ type: 'error', message: res.message || 'Failed to update name.' });
      }
    } catch (err: any) {
      setProfileSaveFeedback({ type: 'error', message: err?.message || 'Error saving to database.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleVerifyProfileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = profileOtpCode.trim();
    if (!cleanCode) {
      setProfileSaveFeedback({ type: 'error', message: 'Please enter the OTP verification code.' });
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveFeedback(null);

    try {
      const verifyRes = await verifyCustomerProfileOtp(profileOtpId, cleanCode, profileTargetPhone);
      if (!verifyRes.success) {
        setProfileSaveFeedback({ type: 'error', message: verifyRes.message || 'Incorrect OTP code. Please check SMS and try again.' });
        setIsSavingProfile(false);
        return;
      }

      // OTP matched successfully! Now save the updated name, phone, and password
      const res = await updateCustomerProfile({
        name: formName.trim(),
        phone: formPhone.trim(),
        password: formPassword.trim() || initialPassword,
      });

      if (res.success) {
        setProfileSaveFeedback({ type: 'success', message: '✅ Phone & Password updated and saved to database!' });
        setTimeout(() => {
          setIsEditProfileOpen(false);
          setIsSettingsModalOpen(false);
          setProfileOtpStep('idle');
          setProfileSaveFeedback(null);
        }, 900);
      } else {
        setProfileSaveFeedback({ type: 'error', message: res.message || 'Failed to save changes.' });
      }
    } catch (err: any) {
      setProfileSaveFeedback({ type: 'error', message: err?.message || 'Error verifying OTP.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResendProfileOtp = async () => {
    if (profileOtpTimer > 0 || isSavingProfile) return;
    setIsSavingProfile(true);
    setProfileSaveFeedback(null);
    try {
      const res = await requestCustomerProfileOtp(profileTargetPhone);
      if (res.success && res.otpId) {
        setProfileOtpId(res.otpId);
        setProfileOtpTimer(30);
        setProfileSaveFeedback({ type: 'success', message: 'New OTP code sent to ' + profileTargetPhone });
      } else {
        setProfileSaveFeedback({ type: 'error', message: res.message || 'Failed to resend OTP.' });
      }
    } catch (e: any) {
      setProfileSaveFeedback({ type: 'error', message: e?.message || 'Error resending OTP.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const [selectedVendorForMenu, setSelectedVendorForMenuState] = useState<Vendor | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('foodiplace_customer_selected_vendor_id');
      if (savedId) {
        const found = vendors.find(v => v.id === savedId);
        if (found) return found;
      }
    }
    return null;
  });

  // Keep active open vendor menu synchronized with real-time vendor updates
  useEffect(() => {
    if (selectedVendorForMenu) {
      const fresh = vendors.find(v => v.id === selectedVendorForMenu.id);
      if (fresh && (
        fresh.discount_percentage !== selectedVendorForMenu.discount_percentage ||
        fresh.discount_title !== selectedVendorForMenu.discount_title ||
        fresh.is_free_delivery !== selectedVendorForMenu.is_free_delivery ||
        fresh.name !== selectedVendorForMenu.name
      )) {
        setSelectedVendorForMenuState(fresh);
      }
    }
  }, [vendors, selectedVendorForMenu]);

  // Phone Physical Back Button & Browser History State Synchronization (Safe placement after initialization)
  const openCount = 
    (activeBottomNav !== 'food' ? 1 : 0) +
    (selectedVendorForMenu ? 1 : 0) + 
    (isViewingCartDetail ? 1 : 0) + 
    (accountSubView !== 'none' ? 1 : 0) + 
    (isChooseAreaModalOpen ? 1 : 0) +
    (isAddressModalOpen ? 1 : 0) + 
    (isCustomerLoginModalOpen ? 1 : 0) +
    (isAuthModalOpen ? 1 : 0) +
    (isRestaurantReviewsOpen ? 1 : 0) +
    (isEditProfileOpen ? 1 : 0) +
    (isSettingsModalOpen ? 1 : 0) +
    (isLogoutConfirmOpen ? 1 : 0) +
    (selectedMenuItemForModal ? 1 : 0) +
    (isUnavailPopupOpen ? 1 : 0) +
    (isCartOpen ? 1 : 0);

  const prevOpenCountRef = useRef(0);
  const isPoppingRef = useRef(false);
  const isProgrammaticBackRef = useRef(0);

  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      prevOpenCountRef.current = openCount;
      return;
    }

    const diff = openCount - prevOpenCountRef.current;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        window.history.pushState({ isModal: true }, '');
      }
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) {
        isProgrammaticBackRef.current++;
        window.history.back();
      }
    }
    prevOpenCountRef.current = openCount;
  }, [openCount, activeBottomNav, selectedVendorForMenu, isViewingCartDetail, accountSubView, isChooseAreaModalOpen, isAddressModalOpen, isCustomerLoginModalOpen, isAuthModalOpen, isRestaurantReviewsOpen, isEditProfileOpen, isSettingsModalOpen, isLogoutConfirmOpen, isCartOpen]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isProgrammaticBackRef.current > 0) {
        isProgrammaticBackRef.current--;
        isPoppingRef.current = true;
        return;
      }

      isPoppingRef.current = true;
      
      // Close topmost modal/view sequentially when back button is pressed on phone
      if (isChooseAreaModalOpen) {
        setIsChooseAreaModalOpen(false);
      } else if (isAddressModalOpen) {
        setIsAddressModalOpen(false);
      } else if (isCustomerLoginModalOpen) {
        setIsCustomerLoginModalOpen(false);
      } else if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
      } else if (isRestaurantReviewsOpen) {
        setIsRestaurantReviewsOpen(false);
      } else if (isEditProfileOpen) {
        setIsEditProfileOpen(false);
      } else if (isSettingsModalOpen) {
        setIsSettingsModalOpen(false);
      } else if (isLogoutConfirmOpen) {
        setIsLogoutConfirmOpen(false);
      } else if (isCartOpen) {
        setIsCartOpen(false);
      } else if (isViewingCartDetail) {
        setIsViewingCartDetail(false);
      } else if (selectedVendorForMenu) {
        setSelectedVendorForMenu(null);
      } else if (accountSubView !== 'none') {
        setAccountSubView('none');
      } else if (activeBottomNav !== 'food') {
        setActiveBottomNav('food');
      } else {
        isPoppingRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAddressModalOpen, isCustomerLoginModalOpen, isAuthModalOpen, isEditProfileOpen, isSettingsModalOpen, isLogoutConfirmOpen, isCartOpen, isViewingCartDetail, selectedVendorForMenu, accountSubView, activeBottomNav]);

  // Refs for scroll sync and sticky header
  const menuScrollContainerRef = useRef<HTMLDivElement>(null);
  const categorySectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [headerScrollOpacity, setHeaderScrollOpacity] = useState(1);
  const [isMenuHeaderSticky, setIsMenuHeaderSticky] = useState(false);

  useEffect(() => {
    if (!selectedVendorForMenu) return;

    const handleScroll = () => {
      if (!menuScrollContainerRef.current) return;
      const scrollPos = menuScrollContainerRef.current.scrollTop;
      
      // Header fade/parallax effect
      const opacity = Math.max(0, 1 - scrollPos / 240);
      setHeaderScrollOpacity(opacity);
      
      // Sticky detection
      setIsMenuHeaderSticky(scrollPos > 280);

      // Scroll Sync: find which section is currently active
      let currentActive = 'All';
      const sections = Object.entries(categorySectionRefs.current);
      for (const [cat, ref] of sections) {
        if (ref && ref.offsetTop - 150 <= scrollPos) {
          currentActive = cat;
        }
      }
      if (currentActive !== activeMenuCategory) {
        setActiveMenuCategory(currentActive);
      }
    };

    const container = menuScrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [selectedVendorForMenu, activeMenuCategory]);

  const scrollToCategory = (cat: string) => {
    const ref = categorySectionRefs.current[cat];
    if (ref && menuScrollContainerRef.current) {
      menuScrollContainerRef.current.scrollTo({
        top: ref.offsetTop - 130,
        behavior: 'smooth'
      });
      setActiveMenuCategory(cat);
    }
  };

  const setSelectedVendorForMenu = (v: Vendor | null) => {
    setSelectedVendorForMenuState(v);
    setMenuSearchQuery('');
    setActiveMenuCategory('All');
    if (typeof window !== 'undefined') {
      if (v) {
        localStorage.setItem('foodiplace_customer_selected_vendor_id', v.id);
      } else {
        localStorage.removeItem('foodiplace_customer_selected_vendor_id');
      }
    }
  };

  
  // Hero Carousel Slides & Swipe state
  // Dynamically build slides from Admin Ad Banners & Boosted Vendors
  const activeAdBanners = [...(adBanners || [])]
    .filter(a => a.is_active && a.subtitle !== '__middle__' && (activeBottomNav === 'food' || activeBottomNav === 'grocery' ? (a.portal_type || 'food') === activeBottomNav : true))
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const activeMiddleBanners = [...(adBanners || [])]
    .filter(a => a.is_active && a.subtitle === '__middle__' && (activeBottomNav === 'food' || activeBottomNav === 'grocery' ? (a.portal_type || 'food') === activeBottomNav : true))
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const boostedVendors = vendors.filter(v => v.is_boosted);

  const heroSlides = useMemo(() => {
    return activeAdBanners.map((ad) => {
      const targetVendorId = ad.target_vendor_id;
      const targetVendor = targetVendorId 
        ? vendors.find(v => v.id === targetVendorId || (v.unique_id && v.unique_id.toLowerCase() === targetVendorId.toLowerCase())) 
        : null;
      return {
        id: `ad-${ad.id}`,
        title: ad.title,
        subtitle: ad.subtitle || null,
        actionText: ad.action_text || 'Redeem now',
        image: ad.image_url,
        videoUrl: ad.video_url || null,
        vendor: targetVendor || null
      };
    });
  }, [activeAdBanners, vendors]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);

  const lastActiveSlideRef = useRef(activeSlide);
  useEffect(() => {
    if (lastActiveSlideRef.current !== activeSlide) {
      setPrevSlide(lastActiveSlideRef.current);
      lastActiveSlideRef.current = activeSlide;
    }
  }, [activeSlide]);

  // Reset active slide when slides list changes (Auto slide turned OFF as requested)
  useEffect(() => {
    setActiveSlide(0);
    setPrevSlide(null);
    lastActiveSlideRef.current = 0;
  }, [heroSlides.length]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const getSlideStyle = (index: number) => {
    if (heroSlides.length <= 1) {
      return { transform: 'translateX(0)', opacity: 1, zIndex: 10 };
    }

    // Active slide (Entering from right to left into center)
    if (index === activeSlide) {
      return { 
        transform: 'translateX(0)', 
        opacity: 1, 
        zIndex: 10,
        transition: 'transform 800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 800ms ease-in-out'
      };
    }

    // Previous active slide (Exiting leftwards out of center)
    if (index === prevSlide) {
      return { 
        transform: 'translateX(-100%)', 
        opacity: 0, 
        zIndex: 0,
        transition: 'transform 800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 800ms ease-in-out'
      };
    }

    // Otherwise, place it on the right (waiting to enter) instantly without transition
    return { 
      transform: 'translateX(100%)', 
      opacity: 0, 
      zIndex: 0,
      transition: 'none'
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;
    if (isLeftSwipe) {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    } else if (isRightSwipe) {
      setActiveSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
    }
  };

  // Checkout
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderInstructions, setOrderInstructions] = useState('');

  // Customer Coordinates strictly from active address in Address Book or default
  const activeCustomerAddress = selectedAddress || addresses?.find(a => a.status === 'active') || addresses?.find(a => a.is_default) || addresses?.[0] || null;
  const customerLat = activeCustomerAddress?.latitude ? Number(activeCustomerAddress.latitude) : 22.3590;
  const customerLng = activeCustomerAddress?.longitude ? Number(activeCustomerAddress.longitude) : 91.8380;

  // Active Customer Zone based strictly on the map pin point (customerLat, customerLng)
  const activeCustomerZone = React.useMemo(() => {
    // 1. Determine zone from exact pin coordinates inside zone boundary / radius
    const zoneFromCoords = findZoneForPoint(customerLat, customerLng, zones, false);
    if (zoneFromCoords) return zoneFromCoords;

    // 2. If address has a zone specified, match that zone
    if (activeCustomerAddress?.zone) {
      const match = zones.find(z => 
        z.name.toLowerCase() === activeCustomerAddress.zone?.toLowerCase() || 
        z.id === activeCustomerAddress.zone
      );
      if (match) return match;
    }

    // 3. Fallback to closest zone for the pin coordinates
    return findZoneForPoint(customerLat, customerLng, zones, true);
  }, [activeCustomerAddress?.zone, customerLat, customerLng, zones]);

  // Helper to extract vendor coordinates safely directly from vendors table lat/long (and Google Maps links if needed)
  const getVendorCoords = React.useCallback((v: Vendor): { lat: number; lng: number } => {
    let lat = typeof v.latitude === 'string' ? parseFloat(v.latitude) : Number(v.latitude || 0);
    let lng = typeof v.longitude === 'string' ? parseFloat(v.longitude) : Number(v.longitude || 0);

    // 1. Parse from google_maps_link if lat/lng are missing or 0
    if ((!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) && v.google_maps_link) {
      const parsed = parseGoogleMapsLinkOrCoords(v.google_maps_link);
      if (parsed && !isNaN(parsed.lat) && !isNaN(parsed.lng)) {
        lat = parsed.lat;
        lng = parsed.lng;
      }
    }

    // 2. Parse from address string if coordinates are embedded
    if ((!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) && v.address) {
      const parsedAddr = parseGoogleMapsLinkOrCoords(v.address);
      if (parsedAddr && !isNaN(parsedAddr.lat) && !isNaN(parsedAddr.lng)) {
        lat = parsedAddr.lat;
        lng = parsedAddr.lng;
      }
    }

    const finalLat = isNaN(lat) || !lat || lat === 0 ? 22.3590 : lat;
    const finalLng = isNaN(lng) || !lng || lng === 0 ? 91.8380 : lng;

    return {
      lat: finalLat,
      lng: finalLng
    };
  }, []);

  // Asynchronously resolve shortened Google Maps links (e.g. maps.app.goo.gl) in background
  useEffect(() => {
    vendors.forEach(v => {
      if (v.google_maps_link && (v.google_maps_link.includes('maps.app.goo.gl') || v.google_maps_link.includes('goo.gl/maps'))) {
        const { lat, lng } = getVendorCoords(v);
        if (!lat || !lng || (lat === 0 && lng === 0)) {
          fetch(`/api/resolve-maps-coords?url=${encodeURIComponent(v.google_maps_link)}`)
            .then(res => res.json())
            .then(data => {
              if (data?.success && data.lat && data.lng) {
                updateVendor(v.id, { latitude: data.lat, longitude: data.lng });
              }
            })
            .catch(() => {});
        }
      }
    });
  }, [vendors, getVendorCoords, updateVendor]);

  // Filtered and Sorted Vendors: Show all vendors belonging to the active customer zone
  const filteredVendors = vendors.filter((v) => {
    // Check active status
    if (v.is_active === false) return false;
    if (v.is_paused) return false;

    // Zone-based filtering: Show vendors belonging to the customer's active zone
    if (activeCustomerZone && zones && zones.length > 0) {
      const targetZoneName = (activeCustomerZone.name || '').trim().toLowerCase();
      const targetZoneBn = (activeCustomerZone.bn_name || '').trim().toLowerCase();
      const targetZoneId = (activeCustomerZone.id || '').trim().toLowerCase();
      const vZone = (v.zone || '').trim().toLowerCase();

      const matchesZone = Boolean(
        vZone === targetZoneName ||
        vZone === targetZoneId ||
        (targetZoneBn && vZone === targetZoneBn) ||
        (vZone && targetZoneName && (
          vZone.includes(targetZoneName.replace(' zone', '')) || 
          targetZoneName.includes(vZone.replace(' zone', ''))
        ))
      );

      if (!matchesZone) {
        return false;
      }
    }

    const matchesSearch = !searchQuery.trim() || 
      (v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.cuisine && v.cuisine.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesRating = !isRating4PlusOnly || (v.rating || 5.0) >= 4.0;
    
    const normalizeCatName = (name: string) => {
      const norm = (name || '').toLowerCase().trim();
      if (norm.includes('biryani') || norm.includes('biriyani')) return 'biryani';
      if (norm.includes('kebab') || norm.includes('kabab')) return 'kebab';
      return norm;
    };

    const hasMenuItemInSelectedCategory = menuItems.some(
      m => m.vendor_id === v.id && 
           m.category && 
           normalizeCatName(m.category) === normalizeCatName(activeCuisineFilter)
    );
    const matchesCuisine = activeCuisineFilter === 'All' || 
      (v.cuisine && v.cuisine.toLowerCase().includes(activeCuisineFilter.toLowerCase())) ||
      (v.cuisine && normalizeCatName(v.cuisine).includes(normalizeCatName(activeCuisineFilter))) ||
      hasMenuItemInSelectedCategory;
    
    // Filter by type: Food page shows restaurants, Grocery page shows shops
    const vType = (v.vendor_type || 'restaurant').toLowerCase();
    const matchesType = activeBottomNav === 'food' 
      ? (vType === 'restaurant' || vType === 'food' || !v.vendor_type) 
      : activeBottomNav === 'grocery' 
        ? (vType === 'shop' || vType === 'grocery')
        : true;

    // Filter by Restaurant Sub-Type (Restaurant, Cloud Kitchen, Home Kitchen)
    const restType = (v.restaurant_type || 'restaurant').toLowerCase();
    const matchesRestType = (activeBottomNav !== 'food' || activeRestaurantTypeFilter === 'All')
      ? true
      : activeRestaurantTypeFilter === 'restaurant'
        ? (restType === 'restaurant' || !v.restaurant_type || (v.cuisine && v.cuisine.toLowerCase() === 'restaurant'))
        : activeRestaurantTypeFilter === 'cloud_kitchen'
          ? (restType === 'cloud_kitchen' || (v.cuisine && v.cuisine.toLowerCase().includes('cloud')) || (v.name && v.name.toLowerCase().includes('cloud')))
          : activeRestaurantTypeFilter === 'home_kitchen'
            ? (restType === 'home_kitchen' || (v.cuisine && v.cuisine.toLowerCase().includes('home')) || (v.name && v.name.toLowerCase().includes('home')))
            : true;

    // Filter by New Vendors (within last 30 days)
    const matchesNew = (!isNewOnly && selectedSort !== 'new') || isVendorNew(v);

    return matchesSearch && matchesRating && matchesCuisine && matchesType && matchesRestType && matchesNew;
  }).sort((a, b) => {
    if (selectedSort === 'rating') return b.rating - a.rating;
    if (selectedSort === 'distance') {
      const coordsA = getVendorCoords(a);
      const coordsB = getVendorCoords(b);
      const distA = calculateDistanceKm(coordsA.lat, coordsA.lng, customerLat, customerLng);
      const distB = calculateDistanceKm(coordsB.lat, coordsB.lng, customerLat, customerLng);
      return distA - distB;
    }
    if (selectedSort === 'new') {
      const isNewA = isVendorNew(a) ? 1 : 0;
      const isNewB = isVendorNew(b) ? 1 : 0;
      if (isNewA !== isNewB) return isNewB - isNewA;
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    }
    return 0;
  });

  // Cart Calculations
  const foodTotal = cart.reduce((sum, item) => sum + (item.unitPrice ?? item.menuItem.price) * item.quantity, 0);
  const cartDistanceKm = cartVendor 
    ? calculateDistanceKm(cartVendor.latitude, cartVendor.longitude, customerLat, customerLng)
    : 0;
  const deliveryFee = cartVendor
    ? (cartVendor.is_free_delivery ? 0 : calculateDeliveryFee(cartDistanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge))
    : 0;
  const totalCashPayable = foodTotal + deliveryFee;
  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = async () => {
    if (!currentUser || currentUser.role !== 'customer') {
      setIsCustomerLoginModalOpen(true);
      return;
    }
    if (!selectedAddress) {
      setIsAddressModalOpen(true);
      return;
    }
    setIsPlacingOrder(true);
    try {
      const placed = await placeOrder(orderInstructions);
      if (placed) {
        setIsCartOpen(false);
        setIsViewingCartDetail(false);
        setActiveBottomNav('account');
        setAccountSubView('orders');
        alert(`✅ Order Placed Successfully!\n\nOrder Code: ${placed.order_code}\nTotal payable (COD): Tk${placed.total_cash_payable}\n\nYour order has been sent to the vendor for confirmation. We have opened your live Order history page so you can track it in real time!`);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // If user is not logged in, show the Login/Registration/OTP page
  if (!currentUser || currentUser.role !== 'customer') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-orange-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
              {signupStep === 'otp' ? <Smartphone className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
            </div>
            <h1 className="text-2xl font-black tracking-tight">foodiplace</h1>
            <p className="text-orange-100 text-sm font-medium mt-1">
              {signupStep === 'otp' ? 'SMS OTP Verification' : 'Welcome back, food lover!'}
            </p>
          </div>

          {/* STEP 2: OTP VERIFICATION VIEW */}
          {signupStep === 'otp' && pendingSignup ? (
            <div className="p-6 space-y-4 animate-in fade-in">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full inline-block">
                  SMS Code Sent
                </span>
                <p className="font-black text-sm text-slate-900 mt-1">Verify Your Number</p>
                <p className="text-xs text-slate-600">
                  We sent an SMS with OTP code to <strong className="text-slate-900">{pendingSignup.phone}</strong>.
                </p>
              </div>

              {otpAlert && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${otpAlert.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  {otpAlert.text}
                </div>
              )}

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!signupOtpInput.trim()) {
                    setOtpAlert({ type: 'error', text: 'Please enter the OTP verification code.' });
                    return;
                  }
                  setIsOtpLoading(true);
                  setOtpAlert(null);
                  try {
                    const vRes = await verifyCustomerSignupOtp(
                      pendingSignup.id,
                      signupOtpInput.trim(),
                      pendingSignup
                    );
                    if (!vRes.success) {
                      setOtpAlert({ type: 'error', text: vRes.message || 'OTP code does not match.' });
                    } else {
                      setOtpAlert({ type: 'success', text: '✅ OTP Verified! Welcome to foodiplace.' });
                      // User is logged in and will automatically transition into customer portal
                    }
                  } catch (err: any) {
                    setOtpAlert({ type: 'error', text: err.message || 'Verification error' });
                  } finally {
                    setIsOtpLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1 text-center">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Enter Verification Code (OTP)
                  </label>
                  <input 
                    type="text"
                    autoFocus
                    maxLength={8}
                    value={signupOtpInput}
                    onChange={(e) => setSignupOtpInput(e.target.value.replace(/\s/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full py-3.5 bg-slate-50 border-2 border-orange-300 rounded-2xl text-2xl font-black text-center tracking-[0.4em] text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white transition"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isOtpLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-600/30 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isOtpLoading ? 'Verifying OTP...' : 'Verify OTP & Complete Signup'}
                </button>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={signupOtpTimer > 0 || isOtpLoading}
                    onClick={async () => {
                      if (signupOtpTimer > 0 || isOtpLoading) return;
                      setIsOtpLoading(true);
                      setOtpAlert(null);
                      try {
                        const res = await requestCustomerSignupOtp(pendingSignup);
                        if (res.success) {
                          setSignupOtpTimer(60);
                          setOtpAlert({ type: 'success', text: 'New OTP dispatched via SMS!' });
                        } else {
                          setOtpAlert({ type: 'error', text: res.message || 'Failed to resend' });
                        }
                      } finally {
                        setIsOtpLoading(false);
                      }
                    }}
                    className="font-bold text-orange-600 hover:text-orange-700 disabled:text-slate-400 flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{signupOtpTimer > 0 ? `Resend (${signupOtpTimer}s)` : 'Resend Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep('form');
                      setOtpAlert(null);
                    }}
                    className="text-slate-500 font-bold hover:underline cursor-pointer"
                  >
                    Change Info / Back
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* STEP 1: LOGIN / REGISTRATION TABS */
            <>
              <div className="flex border-b border-slate-100">
                <button 
                  onClick={() => setAuthTab('login')}
                  className={`flex-1 py-4 text-sm font-black transition-all ${authTab === 'login' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => setAuthTab('register')}
                  className={`flex-1 py-4 text-sm font-black transition-all ${authTab === 'register' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Sign Up
                </button>
              </div>

              <div className="p-6">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const phone = (formData.get('phone') as string || '').trim();
                    const password = (formData.get('password') as string || '').trim();
                    const name = (formData.get('name') as string || '').trim();

                    if (!phone || !password) {
                      alert('Phone and Password are required');
                      return;
                    }

                    if (authTab === 'login') {
                      const res = loginUser('customer', phone, password);
                      if (!res.success) {
                        alert(res.message || 'Login failed');
                      }
                    } else {
                      if (!name) {
                        alert('Name is required for registration');
                        return;
                      }

                      setIsOtpLoading(true);
                      try {
                        const res = await requestCustomerSignupOtp({ name, phone, password });
                        if (!res.success) {
                          alert(res.message || 'Registration failed');
                        } else {
                          setPendingSignup({ id: res.customerId!, name, phone, password });
                          setSignupStep('otp');
                          setSignupOtpTimer(60);
                          setSignupOtpInput('');
                          setOtpAlert({ type: 'success', text: `OTP sent to ${phone} via SMS! Enter code below.` });
                        }
                      } catch (err: any) {
                        alert(err.message || 'Failed to send OTP');
                      } finally {
                        setIsOtpLoading(false);
                      }
                    }
                  }}
                  className="space-y-4"
                >
                  {authTab === 'register' && (
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          name="name"
                          type="text" 
                          required
                          placeholder="Enter your name"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        name="phone"
                        type="tel" 
                        required
                        placeholder="e.g. 01811223344"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <LogIn className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 opacity-50" />
                      <input 
                        name="password"
                        type="password" 
                        required
                        placeholder="Enter password"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isOtpLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-600/30 transition-all active:scale-98 mt-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isOtpLoading ? 'Sending OTP...' : authTab === 'login' ? 'Log In' : 'Send OTP & Create Account'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Cuisine Bubbles (Matching Image 1)
  const cuisineBubbles = [
    { label: 'Pizza', icon: '🍕', filter: 'Pizza', img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=120&auto=format&fit=crop&q=80' },
    { label: 'Burgers', icon: '🍔', filter: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=80' },
    { label: 'Fast Food', icon: '🍗', filter: 'Fast Food', img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=120&auto=format&fit=crop&q=80' },
    { label: 'Bangladeshi', icon: '🐟', filter: 'Bangladeshi', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&auto=format&fit=crop&q=80' },
    { label: 'Rice', icon: '🍚', filter: 'Biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 overflow-x-hidden max-w-full">
      {activeBottomNav === 'orders' || (activeBottomNav === 'account' && accountSubView === 'orders') ? (
        /* 
          ========================================================================
          DEDICATED FULL SCREEN ORDERS VIEW (100% Matching Screenshot_20261005_032143.jpg)
          ========================================================================
        */
        <div className="max-w-md mx-auto min-h-screen bg-slate-50/50 text-slate-900 pb-28 select-none">
          {/* Header: Back/Close, Orders Title, Shopping Cart Icon with Badge */}
          <div className="sticky top-0 bg-white border-b border-slate-100 z-30 px-4 py-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <button 
                onClick={() => {
                  setAccountSubView('none');
                  setActiveBottomNav('food');
                }}
                className="p-1 text-slate-800 hover:text-orange-600 transition flex items-center justify-center cursor-pointer"
                aria-label="Back to Food"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
              <h1 className="text-base font-black text-slate-900">Orders</h1>
            </div>
            <button 
              onClick={() => setActiveBottomNav('carts')}
              className="relative p-1 text-slate-800 hover:text-orange-600 transition flex items-center justify-center cursor-pointer"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4.5 h-4.5 bg-orange-600 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-5 space-y-5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight pl-0.5">Past orders</h2>

            {reviewSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs font-bold text-emerald-800 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                <span>{reviewSuccessMessage}</span>
              </div>
            )}

            {myOrders.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
                  <Receipt className="w-7 h-7 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-800">No past orders found</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Your order history will appear here once you place some delicious cash-on-delivery orders.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAccountSubView('none');
                    setActiveBottomNav('food');
                  }}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
                >
                  Order delicious food
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((ord) => {
                  const vendorImage = ord.vendor?.cover_image || ord.vendor?.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150';
                  
                  // Format delivery date nicely matching screenshot
                  const formattedDate = new Date(ord.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) + ' ' + new Date(ord.created_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const isDelivered = ord.status === 'delivered';
                  const isCancelled = ord.status === 'cancelled';
                  
                  const statusText = isDelivered 
                    ? `Delivered on ${formattedDate}` 
                    : isCancelled
                    ? `Cancelled on ${formattedDate}`
                    : `Status: ${ord.status.replace(/_/g, ' ').toUpperCase()}`;

                  const itemsSummary = (ord.items || []).map(it => `${it.quantity}x ${it.item_name}`).join(', ');

                  return (
                    <div key={ord.id} className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs space-y-4">
                      {/* Upper Content Row */}
                      <div className="flex items-start gap-4">
                        {/* Left Side: Square Vendor Cover image */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                          <img src={vendorImage} alt={ord.vendor?.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Center & Right Details */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-black text-sm text-slate-900 truncate leading-snug">
                              {ord.vendor?.name || 'Restaurant'}
                            </h3>
                            <span className="font-black text-sm text-slate-900 shrink-0">
                              Tk {ord.total_cash_payable}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 leading-tight">
                            {statusText}
                          </p>
                          <p className="text-xs text-slate-400 font-semibold truncate leading-tight pt-0.5">
                            {itemsSummary}
                          </p>
                        </div>
                      </div>

                      {/* Rate & Review Action (Strictly for delivered orders) */}
                      {isDelivered && (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          {(() => {
                            const orderReview = reviews.find(r => r.order_code === ord.order_code || (r.order_id && r.order_id === ord.id));
                            if (orderReview) {
                              return (
                                <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Reviewed</span>
                                  <span className="flex items-center text-amber-500 ml-1">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                                    <span className="ml-0.5 text-slate-800 font-bold">{orderReview.rating}</span>
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <button
                                onClick={() => {
                                  setSelectedOrderForReview(ord);
                                  setReviewRating(5);
                                  setReviewComment('');
                                  setSelectedMentionedDishes((ord.items || []).map(i => i.item_name));
                                }}
                                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300/80 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shadow-2xs active:scale-95"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>Rate & Review Order</span>
                              </button>
                            );
                          })()}

                          <span className="text-[11px] font-bold text-slate-400">
                            Verified delivery
                          </span>
                        </div>
                      )}

                      {!isDelivered && !isCancelled && (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                          <span>Review available after delivery</span>
                          <span className="capitalize text-orange-600 font-bold">{ord.status.replace(/_/g, ' ')}</span>
                        </div>
                      )}

                      {/* Reorder Button */}
                      <button
                        onClick={() => {
                          if (ord.vendor && ord.items && ord.items.length > 0) {
                            clearCart();
                            ord.items.forEach(it => {
                              const foundMenuItem = menuItems.find(mi => mi.id === it.menu_item_id) || {
                                id: it.menu_item_id || `m-${Date.now()}`,
                                vendor_id: ord.vendor_id,
                                name: it.item_name,
                                price: it.item_price,
                                is_available: true,
                                category: 'Main Course',
                                image_url: vendorImage
                              };
                              for (let i = 0; i < it.quantity; i++) {
                                addToCart(foundMenuItem as MenuItem, ord.vendor!);
                              }
                            });
                            setActiveBottomNav('carts');
                            alert(`🛒 Reordered items from "${ord.vendor.name}"!\nAll items have been added to your cart.`);
                          }
                        }}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-2xs cursor-pointer flex items-center justify-center"
                      >
                        Select items to reorder
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : activeBottomNav === 'account' ? ( accountSubView === 'favourites' ? (
          /* 
            ========================================================================
            DEDICATED FULL SCREEN FAVOURITES VIEW (100% Matching Screenshot_20261005_153503.jpg & ..._153506.jpg)
            ========================================================================
          */
          <div className="max-w-md mx-auto min-h-screen bg-white text-slate-900 pb-28 select-none">
            {/* Header: Back Close, Favourites Title, Shopping Cart Icon with Badge */}
            <div className="sticky top-0 bg-white border-b border-slate-100 z-30 px-4 py-3.5 flex items-center justify-between shadow-2xs">
              <button 
                onClick={() => setAccountSubView('none')}
                className="p-1 text-slate-800 hover:text-orange-600 transition flex items-center justify-center cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="w-6 h-6 stroke-[2]" />
              </button>
              <h1 className="text-base font-black text-slate-900">Favourites</h1>
              <button 
                onClick={() => {
                  setAccountSubView('none');
                  setActiveBottomNav('carts');
                }}
                className="relative p-1 text-slate-800 hover:text-orange-600 transition flex items-center justify-center cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4.5 h-4.5 bg-[#DB2777] text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Favourites Tabs: Restaurants & shops */}
            <div className="flex border-b border-slate-100 px-4 text-sm font-black text-slate-500">
              <button
                onClick={() => setFavTab('restaurants')}
                className={`flex-1 py-4 text-center transition-all border-b-3 relative ${
                  favTab === 'restaurants' ? 'text-slate-900 border-black' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>Restaurants</span>
              </button>
              <button
                onClick={() => setFavTab('shops')}
                className={`flex-1 py-4 text-center transition-all border-b-3 relative ${
                  favTab === 'shops' ? 'text-slate-900 border-black' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>shops</span>
              </button>
            </div>

            {/* Display list based on tab */}
            {favTab === 'restaurants' ? (
              <div className="p-4 space-y-5">
                {/* Delivery & Pick-Up pills */}
                <div className="flex items-center space-x-2.5">
                  <button className="px-4 py-2 bg-[#2D2D2D] text-white text-xs font-black rounded-full shadow-sm">
                    Delivery
                  </button>
                  <button className="px-4 py-2 bg-white text-[#2D2D2D] border border-slate-200/80 text-xs font-black rounded-full hover:bg-slate-50">
                    Pick-Up
                  </button>
                </div>

                {/* Restaurants cards or empty state */}
                {vendors.filter(v => favorites.includes(v.id) && (v.vendor_type === 'restaurant' || !v.vendor_type)).length === 0 ? (
                  <div className="py-12 px-6 text-center space-y-6 flex flex-col items-center">
                    {/* Clean Heart Icon Badge */}
                    <div className="w-20 h-20 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shadow-xs mx-auto my-2">
                      <Heart className="w-10 h-10 fill-[#DB2777]/20 text-[#DB2777]" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">No favourites saved</h2>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        To make ordering even faster, you'll find all your faves here. Just look for the heart icon!
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setAccountSubView('none');
                        setActiveBottomNav('food');
                      }}
                      className="px-8 py-3 bg-[#DB2777] hover:bg-[#C2185B] text-white font-extrabold text-xs tracking-wider rounded-2xl shadow-md shadow-pink-600/20 transition cursor-pointer active:scale-95"
                    >
                      Let's find some favourites
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {vendors.filter(v => favorites.includes(v.id) && (v.vendor_type === 'restaurant' || !v.vendor_type)).map((v) => {
                      const distanceKm = calculateDistanceKm(v.latitude, v.longitude, customerLat, customerLng);
                      
                      return (
                        <div 
                          key={v.id}
                          className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200"
                        >
                          {/* Restaurant Image Area */}
                          <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedVendorForMenu(v)}>
                            <img src={v.cover_image} alt={v.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                            {/* Favorite floating pink heart */}
                            <button 
                              onClick={(e) => toggleFavorite(v.id, e)}
                              className="absolute top-3.5 right-3.5 bg-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                              aria-label="Remove Favorite"
                              style={{ width: '34px', height: '34px' }}
                            >
                              <Heart className="w-4.5 h-4.5 fill-[#DB2777] text-[#DB2777]" />
                            </button>
                          </div>

                          {/* Restaurant Info Area */}
                          <div className="p-4 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 
                                onClick={() => setSelectedVendorForMenu(v)}
                                className="font-black text-slate-900 text-[15px] hover:text-orange-600 transition cursor-pointer truncate flex-1 leading-snug"
                              >
                                {v.name}
                              </h3>
                              <div className="flex items-center space-x-1 font-extrabold text-xs text-slate-800 shrink-0 mt-0.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{v.rating || 4.7}</span>
                                <span className="text-slate-400 font-bold">({v.rating ? '2k+' : '50+'})</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 font-bold leading-none flex items-center flex-wrap gap-1.5">
                              <span>{v.estimated_prep_time_minutes || 20}-{ (v.estimated_prep_time_minutes || 20) + 20 } min</span>
                              <span>&bull;</span>
                              <span>৳৳</span>
                              <span>&bull;</span>
                              <span className="truncate">{v.cuisine}</span>
                              <span>&bull;</span>
                              <span>Price Match</span>
                            </p>

                            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-600">
                              <Bike className="w-3.5 h-3.5 text-slate-400" />
                              <span>Standard Delivery</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-5">
                {/* Delivery & Pick-Up pills */}
                <div className="flex items-center space-x-2.5">
                  <button className="px-4 py-2 bg-[#2D2D2D] text-white text-xs font-black rounded-full shadow-sm">
                    Delivery
                  </button>
                  <button className="px-4 py-2 bg-white text-[#2D2D2D] border border-slate-200/80 text-xs font-black rounded-full hover:bg-slate-50">
                    Pick-Up
                  </button>
                </div>

                {/* Shops cards or empty state */}
                {vendors.filter(v => favorites.includes(v.id) && v.vendor_type === 'shop').length === 0 ? (
                  <div className="py-12 px-6 text-center space-y-6 flex flex-col items-center">
                    {/* Clean Heart Icon Badge */}
                    <div className="w-20 h-20 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shadow-xs mx-auto my-2">
                      <Heart className="w-10 h-10 fill-[#DB2777]/20 text-[#DB2777]" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">No favourites saved</h2>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        To make ordering even faster, you'll find all your faves here. Just look for the heart icon!
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setAccountSubView('none');
                        setActiveBottomNav('grocery');
                      }}
                      className="px-8 py-3 bg-[#DB2777] hover:bg-[#C2185B] text-white font-extrabold text-xs tracking-wider rounded-2xl shadow-md shadow-pink-600/20 transition cursor-pointer active:scale-95"
                    >
                      Let's find some shops
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {vendors.filter(v => favorites.includes(v.id) && v.vendor_type === 'shop').map((v) => {
                      const distanceKm = calculateDistanceKm(v.latitude, v.longitude, customerLat, customerLng);
                      
                      return (
                        <div 
                          key={v.id}
                          className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-2xs hover:shadow-xs transition duration-200"
                        >
                          {/* Shop Image Area */}
                          <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedVendorForMenu(v)}>
                            <img src={v.cover_image} alt={v.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                            {/* Favorite floating pink heart */}
                            <button 
                              onClick={(e) => toggleFavorite(v.id, e)}
                              className="absolute top-3.5 right-3.5 bg-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                              aria-label="Remove Favorite"
                              style={{ width: '34px', height: '34px' }}
                            >
                              <Heart className="w-4.5 h-4.5 fill-[#DB2777] text-[#DB2777]" />
                            </button>
                          </div>

                          {/* Shop Info Area */}
                          <div className="p-4 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 
                                onClick={() => setSelectedVendorForMenu(v)}
                                className="font-black text-slate-900 text-[15px] hover:text-[#DB2777] transition cursor-pointer truncate flex-1 leading-snug"
                              >
                                {v.name}
                              </h3>
                              <div className="flex items-center space-x-1 font-extrabold text-xs text-slate-800 shrink-0 mt-0.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{v.rating || 4.7}</span>
                                <span className="text-slate-400 font-bold">({v.rating ? '2k+' : '50+'})</span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 font-bold leading-none flex items-center flex-wrap gap-1.5">
                              <span>{v.estimated_prep_time_minutes || 20}-{ (v.estimated_prep_time_minutes || 20) + 20 } min</span>
                              <span>&bull;</span>
                              <span>৳৳</span>
                              <span>&bull;</span>
                              <span className="truncate">{v.cuisine}</span>
                              <span>&bull;</span>
                              <span>Price Match</span>
                            </p>

                            <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-600">
                              <Bike className="w-3.5 h-3.5 text-slate-400" />
                              <span>Standard Delivery</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 
            ========================================================================
            STANDARD ACCOUNT PAGE (100% Matching Screenshot_20260930_190517.jpg)
            ========================================================================
          */
          <div className="max-w-md mx-auto min-h-screen bg-white text-slate-900 pb-28">
            {/* Top Bar: Account Title on Left + Settings Gear Icon on Right */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account</h1>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={openSettingsModal}
                  className="p-1 text-slate-800 hover:text-orange-600 transition cursor-pointer"
                  aria-label="Settings"
                >
                  <Settings className="w-6 h-6 stroke-[2]" />
                </button>
              </div>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* User Profile or Login Card */}
              {!currentUser || currentUser.role !== 'customer' ? (
                <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-3xl p-6 border border-orange-200/90 shadow-lg relative space-y-4">
                  <div className="space-y-1">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-xs">
                      <User className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight pt-1">
                      Customer Login
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Log in or create an account to track orders & save delivery addresses.
                    </p>
                  </div>

                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-orange-600/30 transition cursor-pointer flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Login / Register Account</span>
                  </button>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{accountDisplayName}</h2>
                  <button 
                    onClick={openEditProfile}
                    className="text-xs font-semibold text-slate-700 hover:text-orange-600 transition mt-1 block cursor-pointer"
                  >
                    View profile
                  </button>
                </div>
              )}

              {/* 3 Action Cards (Orders, Favourites, Addresses) */}
              <div className="grid grid-cols-3 gap-3">
                {/* Orders Card */}
                <button 
                  onClick={() => {
                    setAccountSubView('none');
                    setActiveBottomNav('orders');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-xs transition-all cursor-pointer"
                >
                  <Receipt className="w-6 h-6 text-slate-800 stroke-[1.8]" />
                  <span className="text-xs font-bold text-slate-800 mt-2">Orders</span>
                </button>

                {/* Favourites Card */}
                <button 
                  onClick={() => setAccountSubView(prev => prev === 'favourites' ? 'none' : 'favourites')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    (accountSubView as string) === 'favourites' 
                      ? 'border-orange-500 bg-orange-50/50 shadow-xs' 
                      : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <Heart className={`w-6 h-6 stroke-[1.8] ${favorites.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-800'}`} />
                  <span className="text-xs font-bold text-slate-800 mt-2">Favourites</span>
                </button>

                {/* Addresses Card */}
                <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-xs transition-all"
                >
                  <MapPin className="w-6 h-6 text-slate-800 stroke-[1.8]" />
                  <span className="text-xs font-bold text-slate-800 mt-2">Addresses</span>
                </button>
              </div>

              {/* Bottom Menu List Items (Matching the list at bottom of Screenshot) */}
              <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
                {/* Invite Friends */}
                <div 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'foodiplace', url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('foodiplace link copied to clipboard!');
                    }
                  }}
                  className="py-4 flex items-center justify-between cursor-pointer hover:text-orange-600 group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Gift className="w-5 h-5 text-slate-700 group-hover:text-orange-600" />
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Invite friends</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                </div>

                {/* Help Center */}
                <div 
                  onClick={() => alert('Customer Support: Call 16212 or email support@foodhub.com')}
                  className="py-4 flex items-center justify-between cursor-pointer hover:text-orange-600 group"
                >
                  <div className="flex items-center space-x-3.5">
                    <HelpCircle className="w-5 h-5 text-slate-700 group-hover:text-orange-600" />
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Help center</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                </div>

                {/* Settings */}
                <div 
                  onClick={openSettingsModal}
                  className="py-4 flex items-center justify-between cursor-pointer hover:text-orange-600 group"
                >
                  <div className="flex items-center space-x-3.5">
                    <Settings className="w-5 h-5 text-slate-700 group-hover:text-orange-600" />
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                </div>

                {/* Terms & Policies */}
                <div 
                  onClick={() => alert('Terms & Policies: 100% Cash On Delivery. Base Rate ৳30 + ৳15/km.')}
                  className="py-4 flex items-center justify-between cursor-pointer hover:text-orange-600 group"
                >
                  <div className="flex items-center space-x-3.5">
                    <FileText className="w-5 h-5 text-slate-700 group-hover:text-orange-600" />
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">Terms & policies</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                </div>
              </div>

              {/* Conditional Logout Button */}
              <div className="pt-2 pb-6">
                <button
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="w-full py-3.5 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <LogOut className="w-4 h-4 stroke-[2.5]" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        )
      ) : activeBottomNav === 'carts' ? (
        // ========================================================================
        // DEDICATED CARTS PAGE VIEW (User Cart Tied to Customer Account & DB)
        // ========================================================================
        <div className="min-h-screen bg-slate-50 pb-28 select-none">
          {/* Cart Header - Matches Screenshot */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3.5 shadow-2xs">
            <div className="max-w-md mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    if (isViewingCartDetail) {
                      setIsViewingCartDetail(false);
                    } else {
                      setActiveBottomNav('food');
                    }
                  }}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div>
                  <h1 className="text-lg font-black text-slate-900 leading-tight">
                    {isViewingCartDetail ? 'My Cart' : 'All carts'}
                  </h1>
                  {!isViewingCartDetail && selectedAddress && (
                    <p className="text-[11px] font-bold text-slate-500 flex items-center">
                      Deliver to: <span className="text-orange-600 ml-1 truncate max-w-[150px]">{selectedAddress.address_line}</span>
                    </p>
                  )}
                </div>
              </div>

              {cart.length > 0 && isViewingCartDetail && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear your cart?')) {
                      clearCart();
                      setIsViewingCartDetail(false);
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </header>

          <main className="max-w-md mx-auto p-4 space-y-4">
            {/* 1. All Carts List View (Matches Screenshot_20261005_024412.jpg) */}
            {!isViewingCartDetail ? (
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center space-y-4 shadow-xs my-4">
                    <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-orange-100">
                      <ShoppingBag className="w-10 h-10 stroke-[2]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-900">Your cart is empty</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Explore delicious food from local restaurants and shops to add them to your cart.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveBottomNav('food')}
                      className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md shadow-orange-600/20 active:scale-95 cursor-pointer inline-flex items-center space-x-2"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Explore Restaurants</span>
                    </button>
                  </div>
                ) : (
                  /* Single Vendor Cart Card (Matches Screenshot exactly, made more compact and thinner as requested) */
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3.5">
                    {/* Vendor Info Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                          <img 
                            src={cartVendor?.cover_image || cartVendor?.logo_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150'} 
                            alt={cartVendor?.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="truncate">
                          <h3 className="font-black text-sm text-slate-900 truncate leading-tight">{cartVendor?.name || 'Restaurant'}</h3>
                          <div className="flex items-center text-[10px] font-bold text-slate-500 space-x-1.5 mt-0.5">
                            <span>15-30 mins</span>
                            <span>•</span>
                            <div className="flex items-center text-pink-600">
                              <Bike className="w-3 h-3 mr-1" />
                              <span>Free</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Remove Cart Option Button */}
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to remove this cart? (কার্ট রিমুভ করতে চান?)')) {
                            clearCart();
                          }
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition cursor-pointer text-xs font-bold active:scale-95 shrink-0"
                        title="Remove Cart"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Remove</span>
                      </button>
                    </div>

                    {/* Items Row with Plus Button */}
                    <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-hide">
                      {cart.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="w-11 h-11 rounded-lg border border-slate-100 overflow-hidden shrink-0 bg-slate-50">
                          <img src={item.menuItem.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <button 
                        onClick={() => cartVendor && setSelectedVendorForMenu(cartVendor)}
                        className="w-8 h-8 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Subtotal Row */}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs font-bold text-slate-800">Subtotal</span>
                      <span className="text-sm font-black text-slate-900">Tk{foodTotal}</span>
                    </div>

                    {/* View Cart CTA - Thinner "View your cart" button as requested */}
                    <button
                      onClick={() => setIsViewingCartDetail(true)}
                      className="w-full py-2.5 bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 font-black text-sm rounded-xl transition shadow-2xs active:scale-[0.98]"
                    >
                      View your cart
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* 2. Detailed Checkout View (The original detailed view) */
              <div className="space-y-4">
                {/* Account Isolation Banner */}
                {currentUser && currentUser.role === 'customer' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-2xs flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="font-bold text-emerald-800 truncate">
                        Securely synced with your account
                      </span>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                  <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-600">Selected Items</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-orange-600">{totalCartCount} items</span>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to remove all items from cart? (কার্ট রিমুভ করতে চান?)')) {
                            clearCart();
                            setIsViewingCartDetail(false);
                          }
                        }}
                        className="flex items-center space-x-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
                        title="Remove Cart"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Remove Cart</span>
                      </button>
                    </div>
                  </div>
                  {cart.map((item, cartIdx) => {
                    const itemVarKey = JSON.stringify(item.selectedVariations || []);
                    const itemEffectivePrice = item.unitPrice ?? item.menuItem.price;
                    const itemSubtotal = itemEffectivePrice * item.quantity;

                    return (
                      <div key={`${item.menuItem.id}-${cartIdx}`} className="p-4 flex items-center justify-between gap-3 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {item.menuItem.image_url && (
                            <img
                              src={item.menuItem.image_url}
                              alt={item.menuItem.name}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                          )}
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-xs text-slate-900 truncate">{item.menuItem.name}</h5>
                            <p className="text-[10px] text-slate-500 font-medium">Base: {settings.currency_symbol}{item.menuItem.price}</p>
                            {item.selectedVariations && item.selectedVariations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {item.selectedVariations.map((v, vIdx) => (
                                  <span key={vIdx} className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {v.optionName} {v.price > 0 ? `(+${settings.currency_symbol}${v.price})` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-[11px] font-bold text-orange-600 font-mono mt-0.5">
                              {settings.currency_symbol}{itemEffectivePrice} × {item.quantity} = {settings.currency_symbol}{itemSubtotal}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                            <button
                              onClick={() => updateCartQuantity(item.menuItem.id, item.quantity - 1, itemVarKey)}
                              className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer hover:bg-slate-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1, itemVarKey)}
                              className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center shadow-2xs cursor-pointer hover:bg-slate-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {/* Remove item button */}
                          <button
                            onClick={() => removeFromCart(item.menuItem.id, itemVarKey)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Address Card */}
                <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      <span>Delivery Address</span>
                    </span>
                    <button onClick={() => setIsAddressModalOpen(true)} className="text-xs font-bold text-orange-600 hover:underline">Change</button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <p className="font-extrabold text-slate-900">{selectedAddress?.label || 'Current Location'}</p>
                    <p className="text-slate-500 mt-0.5">{selectedAddress?.address_line}</p>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3 text-xs">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-600">Bill Details</h4>
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>Subtotal</span>
                    <span className="font-mono">{settings.currency_symbol}{foodTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-bold">
                    <span>Delivery Fee</span>
                    <span className="font-mono">{settings.currency_symbol}{deliveryFee}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between font-black text-base text-slate-900">
                    <span>Total</span>
                    <span className="font-mono text-orange-600">{settings.currency_symbol}{totalCashPayable}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  disabled={isPlacingOrder}
                  onClick={handleCheckout}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-600/30 transition flex items-center justify-center space-x-2 active:scale-[0.98]"
                >
                  <Banknote className="w-5 h-5" />
                  <span>{isPlacingOrder ? 'Confirming Order...' : `Confirm Cash on Delivery`}</span>
                </button>
              </div>
            )}
          </main>
        </div>
      ) : (
        <>
          {/* 
            ========================================================================
            1. SOLID BRAND HEADER (100% Matching Screenshot 1 / Screenshot_20261007_182049_Gallery.jpg)
            Header wrapping Location and Search bar
            ========================================================================
          */}
          <header className="bg-gradient-to-b from-orange-600 via-orange-500 to-orange-500 text-white pt-[max(env(safe-area-inset-top),0.75rem)] pb-6 px-4 rounded-b-[2.5rem] shadow-sm">
            <div className="max-w-md mx-auto space-y-3">
              {/* Top Row: Location Pin + Choose Area + Fullscreen + Heart */}
              <div className="flex items-center justify-between">
                <div 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="flex items-start space-x-2 cursor-pointer group flex-1 min-w-0 pr-2"
                >
                  <MapPin className="w-5 h-5" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-orange-200 leading-tight flex items-center gap-1">
                      <span>Deliver to</span>
                      <ChevronDown className="w-3 h-3 stroke-[3]" />
                    </p>
                    <p className="text-sm font-black truncate leading-tight group-hover:underline">
                      {selectedAddress ? selectedAddress.address_line : 'Select Delivery Location'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setActiveBottomNav('account');
                      setAccountSubView('favourites');
                    }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer relative"
                    title="Favourites"
                  >
                    <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-white text-white' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for dishes, restaurants..."
                  className="w-full pl-10 pr-10 py-3 bg-white text-slate-900 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none shadow-inner"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="max-w-md mx-auto p-4 space-y-6">
            {/* 2. Dynamic Banner Slider */}
            {heroSlides.length > 0 && (
              <div 
                className="relative h-44 rounded-3xl overflow-hidden shadow-sm touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {heroSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    style={getSlideStyle(idx)}
                    className="absolute inset-0 w-full h-full bg-slate-900"
                  >
                    <img src={slide.image} alt="" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-4 flex flex-col justify-end text-white">
                      <h3 className="text-lg font-black leading-tight">{slide.title}</h3>
                      {slide.subtitle && <p className="text-xs text-orange-200 font-bold mt-0.5">{slide.subtitle}</p>}
                    </div>
                  </div>
                ))}

                {heroSlides.length > 1 && (
                  <div className="absolute bottom-3 right-4 flex space-x-1.5 z-20">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-1.5 rounded-full transition-all ${idx === activeSlide ? 'w-5 bg-orange-500' : 'w-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Cuisine Bubbles Carousel */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 pl-1">Cuisines</h2>
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                {cuisineBubbles.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCuisineFilter(activeCuisineFilter === c.filter ? 'All' : c.filter)}
                    className={`flex flex-col items-center space-y-1.5 shrink-0 transition-transform active:scale-95 ${activeCuisineFilter === c.filter ? 'scale-105' : ''}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden p-0.5 border-2 ${activeCuisineFilter === c.filter ? 'border-orange-500 shadow-md' : 'border-slate-100'}`}>
                      <img src={c.img} alt={c.label} className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <span className={`text-xs font-bold ${activeCuisineFilter === c.filter ? 'text-orange-600' : 'text-slate-700'}`}>
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Filter & Vendor List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">
                  {activeBottomNav === 'food' ? 'All Restaurants' : 'Shops'}
                </h2>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                  <button 
                    onClick={() => setIsRating4PlusOnly(!isRating4PlusOnly)} 
                    className={`px-3 py-1.5 rounded-xl border transition ${isRating4PlusOnly ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-slate-200'}`}
                  >
                    ⭐ 4.0+
                  </button>
                </div>
              </div>

              {filteredVendors.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-slate-50 rounded-3xl border border-slate-100">
                  <Store className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No restaurants found in your area</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVendors.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVendorForMenu(v)}
                      className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xs hover:shadow-xs transition cursor-pointer group"
                    >
                      <div className="relative h-44 bg-slate-100">
                        <img src={v.cover_image} alt={v.name} className="w-full h-full object-cover group-hover:scale-102 transition duration-300" />
                        <button
                          onClick={(e) => toggleFavorite(v.id, e)}
                          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-700 hover:text-rose-500 transition"
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(v.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h3 className="font-black text-slate-900 text-base group-hover:text-orange-600 transition truncate pr-2">
                            {v.name}
                          </h3>
                          <div className="flex items-center space-x-1 font-bold text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{v.rating || 5.0}</span>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-slate-500 truncate">{v.cuisine}</p>

                        <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-400 pt-1">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            {v.estimated_prep_time_minutes || 20} min
                          </span>
                          <span>•</span>
                          <span className="flex items-center text-emerald-600">
                            <Bike className="w-3 h-3 mr-1" />
                            {v.is_free_delivery ? 'Free Delivery' : 'Standard Delivery'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* Persistent Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-2.5 px-6 z-40 max-w-md mx-auto flex justify-between items-center shadow-lg">
        <button
          onClick={() => {
            setAccountSubView('none');
            setActiveBottomNav('food');
          }}
          className={`flex flex-col items-center space-y-1 transition cursor-pointer ${activeBottomNav === 'food' ? 'text-orange-600 font-black' : 'text-slate-400 hover:text-slate-600 font-semibold'}`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-[10px]">Food</span>
        </button>

        <button
          onClick={() => {
            setAccountSubView('none');
            setActiveBottomNav('grocery');
          }}
          className={`flex flex-col items-center space-y-1 transition cursor-pointer ${activeBottomNav === 'grocery' ? 'text-orange-600 font-black' : 'text-slate-400 hover:text-slate-600 font-semibold'}`}
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px]">Grocery</span>
        </button>

        <button
          onClick={() => {
            setAccountSubView('none');
            setActiveBottomNav('carts');
          }}
          className={`flex flex-col items-center space-y-1 transition cursor-pointer relative ${activeBottomNav === 'carts' ? 'text-orange-600 font-black' : 'text-slate-400 hover:text-slate-600 font-semibold'}`}
        >
          <ShoppingBag className="w-5 h-5" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 right-2 bg-orange-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {totalCartCount}
            </span>
          )}
          <span className="text-[10px]">Carts</span>
        </button>

        <button
          onClick={() => {
            setAccountSubView('none');
            setActiveBottomNav('orders');
          }}
          className={`flex flex-col items-center space-y-1 transition cursor-pointer ${activeBottomNav === 'orders' ? 'text-orange-600 font-black' : 'text-slate-400 hover:text-slate-600 font-semibold'}`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px]">Orders</span>
        </button>

        <button
          onClick={() => {
            setAccountSubView('none');
            setActiveBottomNav('account');
          }}
          className={`flex flex-col items-center space-y-1 transition cursor-pointer ${activeBottomNav === 'account' ? 'text-orange-600 font-black' : 'text-slate-400 hover:text-slate-600 font-semibold'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Account</span>
        </button>
      </nav>

      {/* Modals & Overlays */}
      {isAddressModalOpen && (
        <AddressBookModal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} />
      )}

      {isAuthModalOpen && (
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultRole="customer" />
      )}
    </div>
  );
};
