import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDelivery } from '../../context/DeliveryContext';
import { AddressBookModal } from './AddressBookModal';
import { AuthModal } from '../common/AuthModal';
import { CustomerRestaurantReviewsModal } from './CustomerRestaurantReviewsModal';
import { calculateDistanceKm, calculateDeliveryFee, findZoneForPoint, isPointInZone, parseGoogleMapsLinkOrCoords } from '../../utils/geo';
import { getItemPricing } from '../../utils/pricing';
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
  ShieldCheck,
  MoreHorizontal
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
  const [showBillSummary, setShowBillSummary] = useState(false);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [isCheckoutScreen, setIsCheckoutScreen] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'priority'>('standard');
  const [riderTip, setRiderTip] = useState<number>(0);
  const [isCustomTipActive, setIsCustomTipActive] = useState<boolean>(false);
  const [checkoutInstructions, setCheckoutInstructions] = useState<string>('');
  const [isPaymentSelectionOpen, setIsPaymentSelectionOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card' | 'other'>('cash');
  const [tempPaymentMethod, setTempPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card' | 'other'>('cash');

  // Cart summary totals for "All Carts" card view
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemEffectivePrice = item.unitPrice ?? item.menuItem.price;
      return sum + (itemEffectivePrice * item.quantity);
    }, 0);
  }, [cart]);

  const cartRegularTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemExtrasPrice = (item.selectedVariations || []).reduce((s, opt) => s + (Number(opt.price) || 0), 0);
      const itemPricing = getItemPricing(item.menuItem, cartVendor, itemExtrasPrice);
      return sum + (itemPricing.regularPrice * item.quantity);
    }, 0);
  }, [cart, cartVendor]);

  const cartTotalSavings = Math.max(0, cartRegularTotal - cartSubtotal);

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

  // Selected Vendor for Menu Modal
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
        id: 'variation-group',
        name: 'Variation',
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
    setSelectedModalVariations({});
  };

  // Separate pure dish variations (portions/sizes) from recommended menu items
  const dishVariations = useMemo(() => {
    return Object.entries(selectedModalVariations)
      .filter(([k, opt]) => !k.startsWith('rec_') && opt.groupName !== 'Frequently bought together')
      .map(([_, opt]) => opt);
  }, [selectedModalVariations]);

  const selectedRecItems = useMemo(() => {
    return Object.entries(selectedModalVariations)
      .filter(([k, opt]) => k.startsWith('rec_') || opt.groupName === 'Frequently bought together')
      .map(([k, opt]) => {
        const id = k.startsWith('rec_') ? k.replace('rec_', '') : '';
        return menuItems.find(m => m.id === id || m.name.toLowerCase() === opt.optionName.toLowerCase());
      })
      .filter((m): m is MenuItem => Boolean(m));
  }, [selectedModalVariations, menuItems]);

  const modalPricing = useMemo(() => {
    if (!selectedMenuItemForModal) {
      return { regularPrice: 0, discountedPrice: 0, discountPercent: 0, hasDiscount: false, discountAmount: 0 };
    }
    const extrasPrice = dishVariations.reduce((sum, opt) => {
      return sum + (Number(opt.price) || 0);
    }, 0);
    return getItemPricing(selectedMenuItemForModal, selectedVendorForMenu, extrasPrice);
  }, [selectedMenuItemForModal, selectedVendorForMenu, dishVariations]);

  const calculatedModalUnitPrice = modalPricing.discountedPrice;

  const calculatedModalTotal = useMemo(() => {
    const dishSubtotal = calculatedModalUnitPrice * modalQuantity;
    const recsSubtotal = selectedRecItems.reduce((sum, recItem) => {
      const p = getItemPricing(recItem, selectedVendorForMenu);
      return sum + p.discountedPrice;
    }, 0);
    return dishSubtotal + recsSubtotal;
  }, [calculatedModalUnitPrice, modalQuantity, selectedRecItems, selectedVendorForMenu]);

  const calculatedModalRegularTotal = useMemo(() => {
    const dishReg = modalPricing.regularPrice * modalQuantity;
    const recsReg = selectedRecItems.reduce((sum, recItem) => {
      const p = getItemPricing(recItem, selectedVendorForMenu);
      return sum + p.regularPrice;
    }, 0);
    return dishReg + recsReg;
  }, [modalPricing, modalQuantity, selectedRecItems, selectedVendorForMenu]);

  const handleConfirmAddToCartFromModal = () => {
    if (!selectedMenuItemForModal || !selectedVendorForMenu) return;

    // 1. Add main dish with only its portion/size variations
    addToCart(
      selectedMenuItemForModal,
      selectedVendorForMenu,
      modalQuantity,
      dishVariations,
      modalSpecialInstructions,
      calculatedModalUnitPrice
    );

    // 2. Add each selected recommendation item as its own MenuItem with image into the cart!
    selectedRecItems.forEach(recItem => {
      const recPricing = getItemPricing(recItem, selectedVendorForMenu);
      addToCart(
        recItem,
        selectedVendorForMenu,
        1,
        [],
        '',
        recPricing.discountedPrice
      );
    });

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

  // Lock body scroll when any modal or sheet or menu view is open so background never scrolls
  useEffect(() => {
    const isAnyModalActive = Boolean(
      selectedVendorForMenu ||
      selectedMenuItemForModal || 
      isChooseAreaModalOpen || 
      isAddressModalOpen || 
      isCustomerLoginModalOpen || 
      isAuthModalOpen || 
      isRestaurantReviewsOpen || 
      isEditProfileOpen || 
      isSettingsModalOpen || 
      isLogoutConfirmOpen || 
      isUnavailPopupOpen || 
      isSortMenuOpen
    );

    if (isAnyModalActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [
    selectedVendorForMenu,
    selectedMenuItemForModal, 
    isChooseAreaModalOpen, 
    isAddressModalOpen, 
    isCustomerLoginModalOpen, 
    isAuthModalOpen, 
    isRestaurantReviewsOpen, 
    isEditProfileOpen, 
    isSettingsModalOpen, 
    isLogoutConfirmOpen, 
    isUnavailPopupOpen, 
    isSortMenuOpen
  ]);

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
      } finally {
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

      // If vendor has an assigned zone, check if it matches the customer's zone
      if (vZone) {
        const matchesZone = Boolean(
          vZone === targetZoneName ||
          vZone === targetZoneId ||
          (targetZoneBn && vZone === targetZoneBn) ||
          (targetZoneName && (
            vZone.includes(targetZoneName.replace(' zone', '')) || 
            targetZoneName.includes(vZone.replace(' zone', ''))
          ))
        );

        if (!matchesZone) {
          return false;
        }
      }
      // If vendor doesn't have a zone set in database, allow it through so it isn't hidden
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

    // Filter by Restaurant Sub-Type (Restaurant, Cloud Kitchen, Home Kitchen, Sweets & Bakery)
    const restType = (v.restaurant_type || 'restaurant').toLowerCase();
    const matchesRestType = (activeBottomNav !== 'food' || activeRestaurantTypeFilter === 'All')
      ? true
      : activeRestaurantTypeFilter === 'restaurant'
        ? (restType === 'restaurant' || !v.restaurant_type || (v.cuisine && v.cuisine.toLowerCase() === 'restaurant'))
        : activeRestaurantTypeFilter === 'cloud_kitchen'
          ? (restType === 'cloud_kitchen' || (v.cuisine && v.cuisine.toLowerCase().includes('cloud')) || (v.name && v.name.toLowerCase().includes('cloud')))
          : activeRestaurantTypeFilter === 'home_kitchen'
            ? (restType === 'home_kitchen' || (v.cuisine && v.cuisine.toLowerCase().includes('home')) || (v.name && v.name.toLowerCase().includes('home')))
            : activeRestaurantTypeFilter === 'sweets_bakery'
              ? (restType === 'sweets_bakery' || (v.cuisine && (v.cuisine.toLowerCase().includes('sweet') || v.cuisine.toLowerCase().includes('bakery') || v.cuisine.toLowerCase().includes('cake') || v.cuisine.toLowerCase().includes('pastry') || v.cuisine.toLowerCase().includes('confectionery'))) || (v.name && (v.name.toLowerCase().includes('sweet') || v.name.toLowerCase().includes('bakery') || v.name.toLowerCase().includes('cake') || v.name.toLowerCase().includes('pastry') || v.name.toLowerCase().includes('confectionery'))))
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

  // Fallback: If zone/category filter produces 0 items but vendors exist in database, display all active vendors
  const displayVendors = (filteredVendors.length === 0 && vendors.length > 0 && !searchQuery.trim())
    ? vendors.filter(v => v.is_active !== false && !v.is_paused)
    : filteredVendors;

  // Cart Calculations
  const foodTotal = cart.reduce((sum, item) => sum + (item.unitPrice ?? item.menuItem.price) * item.quantity, 0);
  const regularFoodTotal = cart.reduce((sum, item) => {
    const extrasPrice = (item.selectedVariations || []).reduce((s, opt) => s + (Number(opt.price) || 0), 0);
    const pricing = getItemPricing(item.menuItem, cartVendor, extrasPrice);
    return sum + pricing.regularPrice * item.quantity;
  }, 0);
  const totalDiscountSaved = Math.max(0, regularFoodTotal - foodTotal);
  const cartDistanceKm = cartVendor 
    ? calculateDistanceKm(cartVendor.latitude, cartVendor.longitude, customerLat, customerLng)
    : 0;
  const deliveryFee = (orderType === 'pickup')
    ? 0
    : (cartVendor
        ? (cartVendor.is_free_delivery ? 0 : calculateDeliveryFee(cartDistanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge))
        : 0);
  const totalCashPayable = foodTotal + deliveryFee;
  const regularTotalWithFee = regularFoodTotal + deliveryFee;
  const platformFee = 18;
  const priorityFee = deliveryOption === 'priority' ? 28 : 0;
  const finalCheckoutPayable = foodTotal + (orderType === 'pickup' ? 0 : deliveryFee) + priorityFee + riderTip + platformFee;

  const totalCartCount = cart.reduce((sum, i) => {
    const optionCount = (i.selectedVariations && Array.isArray(i.selectedVariations)) ? i.selectedVariations.length : 0;
    return sum + (i.quantity * (1 + optionCount));
  }, 0);

  const handleCheckout = () => {
    if (!currentUser || currentUser.role !== 'customer') {
      setIsCustomerLoginModalOpen(true);
      return;
    }
    if (!selectedAddress) {
      setIsAddressModalOpen(true);
      return;
    }
    setIsCheckoutScreen(true);
  };

  const handlePlaceFinalOrder = async () => {
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
      const combinedInstructions = [
        checkoutInstructions || orderInstructions,
        deliveryOption === 'priority' ? '[Priority Delivery (+Tk 28)]' : '',
        riderTip > 0 ? `[Rider Tip: Tk ${riderTip}]` : '',
        `[Payment: ${selectedPaymentMethod.toUpperCase()}]`
      ].filter(Boolean).join(' | ');

      const placed = await placeOrder(combinedInstructions);
      if (placed) {
        setIsCartOpen(false);
        setIsViewingCartDetail(false);
        setIsCheckoutScreen(false);
        setActiveBottomNav('account');
        setAccountSubView('orders');
        alert(`✅ Order Placed Successfully!\n\nOrder Code: ${placed.order_code}\nTotal payable (COD): Tk${placed.total_cash_payable || finalCheckoutPayable}\n\nYour order has been sent to the vendor for confirmation. We have opened your live Order history page so you can track it in real time!`);
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

                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-600">
                                <Bike className="w-3.5 h-3.5 text-slate-400" />
                                <span>Standard Delivery</span>
                              </div>
                              {Boolean((v.discount_title && String(v.discount_title).trim() && v.discount_title !== 'null' && v.discount_title !== 'undefined') || (v.discount_percentage && Number(v.discount_percentage) > 0)) && (
                                <div className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-200 text-[10px] font-black w-fit">
                                  <Tag className="w-3 h-3" />
                                  <span>{(v.discount_title && v.discount_title !== 'null' && v.discount_title !== 'undefined') ? v.discount_title : `${v.discount_percentage}% OFF`}</span>
                                </div>
                              )}
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

                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-600">
                                <Bike className="w-3.5 h-3.5 text-slate-400" />
                                <span>Standard Delivery</span>
                              </div>
                              {Boolean((v.discount_title && String(v.discount_title).trim() && v.discount_title !== 'null' && v.discount_title !== 'undefined') || (v.discount_percentage && Number(v.discount_percentage) > 0)) && (
                                <div className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-200 text-[10px] font-black w-fit">
                                  <Tag className="w-3 h-3" />
                                  <span>{(v.discount_title && v.discount_title !== 'null' && v.discount_title !== 'undefined') ? v.discount_title : `${v.discount_percentage}% OFF`}</span>
                                </div>
                              )}
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
        isPaymentSelectionOpen ? (
          // ========================================================================
          // PAYMENT METHOD SELECTION PAGE (100% Matching Screenshot_20261029_174133.jpg)
          // ========================================================================
          <div className="min-h-screen bg-white pb-36 select-none font-sans">
            <div className="max-w-md mx-auto">
              {/* Header Row */}
              <header className="px-4 pt-4 pb-3 flex items-center space-x-3.5 bg-white border-b border-slate-100 sticky top-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsPaymentSelectionOpen(false)}
                  className="w-11 h-11 rounded-full border border-slate-200/90 bg-white flex items-center justify-center text-slate-900 hover:bg-slate-50 transition cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                </button>
                <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
                  Select a payment method
                </h1>
              </header>

              {/* Payment Options List */}
              <div className="p-4 space-y-5">
                {/* Rocket */}
                <div
                  onClick={() => setTempPaymentMethod('rocket')}
                  className="flex items-center justify-between py-2.5 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0 overflow-hidden">
                      <span className="font-mono text-[10px] font-black tracking-tighter">Rocket</span>
                    </div>
                    <span className="font-extrabold text-base text-slate-900">
                      Rocket
                    </span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      tempPaymentMethod === 'rocket' ? 'border-slate-900' : 'border-slate-300'
                    }`}
                  >
                    {tempPaymentMethod === 'rocket' && (
                      <div className="w-3 h-3 rounded-full bg-slate-900" />
                    )}
                  </div>
                </div>

                {/* upay */}
                <div
                  onClick={() => setTempPaymentMethod('upay')}
                  className="flex items-center justify-between py-2.5 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-black text-xs shrink-0 overflow-hidden">
                      <span className="font-mono text-[11px]">upay</span>
                    </div>
                    <span className="font-extrabold text-base text-slate-900">
                      upay
                    </span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      tempPaymentMethod === 'upay' ? 'border-slate-900' : 'border-slate-300'
                    }`}
                  >
                    {tempPaymentMethod === 'upay' && (
                      <div className="w-3 h-3 rounded-full bg-slate-900" />
                    )}
                  </div>
                </div>

                {/* Nagad */}
                <div
                  onClick={() => setTempPaymentMethod('nagad')}
                  className="flex items-center justify-between py-2.5 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs shrink-0 overflow-hidden">
                      <span className="font-mono text-[11px]">Nagad</span>
                    </div>
                    <span className="font-extrabold text-base text-slate-900">
                      Nagad
                    </span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      tempPaymentMethod === 'nagad' ? 'border-slate-900' : 'border-slate-300'
                    }`}
                  >
                    {tempPaymentMethod === 'nagad' && (
                      <div className="w-3 h-3 rounded-full bg-slate-900" />
                    )}
                  </div>
                </div>

                {/* Cash */}
                <div
                  onClick={() => setTempPaymentMethod('cash')}
                  className="flex items-center justify-between py-2.5 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-slate-200 flex items-center justify-center text-slate-800 text-lg shrink-0">
                      💵
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-base text-slate-900">
                        Cash
                      </span>
                      <span className="bg-slate-200/80 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-600" />
                        <span>Primary</span>
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      tempPaymentMethod === 'cash' ? 'border-slate-900' : 'border-slate-300'
                    }`}
                  >
                    {tempPaymentMethod === 'cash' && (
                      <div className="w-3 h-3 rounded-full bg-slate-900" />
                    )}
                  </div>
                </div>

                {/* bKash */}
                <div
                  onClick={() => setTempPaymentMethod('bkash')}
                  className="flex items-center justify-between py-2.5 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-[#e21b70] font-black text-xs shrink-0 overflow-hidden">
                      <span className="font-mono text-[11px]">bKash</span>
                    </div>
                    <span className="font-extrabold text-base text-slate-900">
                      bKash
                    </span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      tempPaymentMethod === 'bkash' ? 'border-slate-900' : 'border-slate-300'
                    }`}
                  >
                    {tempPaymentMethod === 'bkash' && (
                      <div className="w-3 h-3 rounded-full bg-slate-900" />
                    )}
                  </div>
                </div>

                {/* Credit or debit card */}
                <div
                  onClick={() => setTempPaymentMethod('card')}
                  className="flex items-center justify-between py-3 cursor-pointer group border-t border-slate-100 pt-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-sm shrink-0">
                        💳
                      </div>
                      <span className="font-extrabold text-base text-slate-900">
                        Credit or debit card
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 pl-11">
                      <span className="bg-slate-100 text-slate-600 font-black text-[9px] px-1.5 py-0.5 rounded">VISA</span>
                      <span className="bg-slate-100 text-slate-600 font-black text-[9px] px-1.5 py-0.5 rounded">MC</span>
                      <span className="bg-slate-100 text-slate-600 font-black text-[9px] px-1.5 py-0.5 rounded">AMEX</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-800 shrink-0 stroke-[2.2]" />
                </div>

                {/* Other online payment methods */}
                <div
                  onClick={() => setTempPaymentMethod('other')}
                  className="flex items-center justify-between py-3 cursor-pointer group border-t border-slate-100 pt-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                        Z
                      </div>
                      <span className="font-extrabold text-base text-slate-900">
                        Other online payment methods
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 pl-11 text-[9px] font-bold text-slate-400">
                      <span>MYCash • Tap • DBBL • CellFin</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-800 shrink-0 stroke-[2.2]" />
                </div>
              </div>

              {/* Sticky Bottom Confirm Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 p-4 z-30 shadow-2xl">
                <div className="max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaymentMethod(tempPaymentMethod);
                      setIsPaymentSelectionOpen(false);
                    }}
                    className="w-full py-4 bg-[#e21b70] hover:bg-[#c2135d] text-white font-extrabold text-base rounded-full shadow-lg shadow-pink-500/25 transition active:scale-[0.98] cursor-pointer text-center"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : isCheckoutScreen ? (
          // ========================================================================
          // DEDICATED CHECKOUT PAGE
          // ========================================================================
          <div className="min-h-screen bg-slate-50/60 pb-36 select-none font-sans">
            <div className="max-w-md mx-auto">
              {/* Top Header Row: Circular Back Arrow + Checkout Title & Restaurant Name */}
              <header className="px-4 pt-4 pb-3 flex items-center space-x-3.5 bg-white sticky top-0 z-10 border-b border-slate-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsCheckoutScreen(false)}
                  className="w-11 h-11 rounded-full border border-slate-200/90 bg-white flex items-center justify-center text-slate-900 hover:bg-slate-50 transition cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                  title="Back to Cart"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
                    Checkout
                  </h1>
                  <p className="text-xs font-semibold text-slate-700 leading-tight truncate mt-0.5">
                    {cartVendor?.name || 'Special Bhai Bhai Biriyani House'}
                  </p>
                </div>
              </header>

              <div className="p-4 space-y-6">
                {/* 1. Delivering to */}
                <section className="space-y-2">
                  <h2 className="text-lg font-black text-slate-950 tracking-tight">
                    Delivering to
                  </h2>
                  <div
                    onClick={() => setIsAddressModalOpen(true)}
                    className="bg-white border border-slate-200/90 rounded-3xl p-4 flex items-center justify-between shadow-2xs cursor-pointer hover:border-slate-300 transition"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 bg-slate-50">
                        <MapPin className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-950 text-base leading-snug truncate">
                          {activeCustomerAddress?.label || '2'}
                        </div>
                        <div className="text-sm font-medium text-slate-600 truncate">
                          {activeCustomerAddress?.address_line || 'Dhaka'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-800 shrink-0 stroke-[2.2]" />
                  </div>
                </section>

                {/* 2. Delivery instructions */}
                <section className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Delivery instructions
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={checkoutInstructions}
                      onChange={(e) => setCheckoutInstructions(e.target.value)}
                      placeholder="(Optional) Floor or Apt No or tell us ho..."
                      className="w-full bg-white border-2 border-slate-900 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>
                </section>

                {/* 3. Delivery options (Standard only) */}
                <section className="space-y-3">
                  <h2 className="text-lg font-black text-slate-950 tracking-tight">
                    Delivery options
                  </h2>

                  {/* Standard Option */}
                  <div
                    className="bg-white rounded-2xl p-4 border border-2 border-slate-900 shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center shrink-0">
                        <div className="w-3 h-3 rounded-full bg-slate-900" />
                      </div>
                      <div className="font-extrabold text-slate-950 text-base">
                        Standard <span className="font-semibold text-slate-700 text-sm">40 - 60 mins</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Tip your rider */}
                <section className="space-y-2.5">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 tracking-tight">
                      Tip your rider
                    </h2>
                    <p className="text-xs font-semibold text-slate-500">
                      Your rider receives 100% of the tip
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
                    {[10, 20, 30, 50].map((amt) => {
                      const isSelected = !isCustomTipActive && riderTip === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setIsCustomTipActive(false);
                            setRiderTip(isSelected ? 0 : amt);
                          }}
                          className={`py-2.5 px-4 rounded-full font-extrabold text-xs transition shrink-0 cursor-pointer border ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          Tk {amt}
                        </button>
                      );
                    })}

                    {/* Custom Tip Pill */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTipActive(true);
                        const val = prompt('Enter tip amount in Tk:', String(riderTip || ''));
                        if (val !== null) {
                          const parsed = parseInt(val, 10);
                          setRiderTip(isNaN(parsed) || parsed < 0 ? 0 : parsed);
                        }
                      }}
                      className={`py-2.5 px-4 rounded-full font-extrabold text-xs transition shrink-0 cursor-pointer border ${
                        isCustomTipActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isCustomTipActive && riderTip > 0 ? `Tk ${riderTip}` : 'Custom'}
                    </button>
                  </div>
                </section>

                {/* 5. Payment method */}
                <section className="space-y-2">
                  <div
                    onClick={() => {
                      setTempPaymentMethod(selectedPaymentMethod);
                      setIsPaymentSelectionOpen(true);
                    }}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <h2 className="text-lg font-black text-slate-950 tracking-tight">
                      Payment method
                    </h2>
                    <button
                      type="button"
                      className="text-slate-900 p-1 hover:text-[#e21b70] transition cursor-pointer"
                      aria-label="Select payment method"
                    >
                      <ChevronRight className="w-5.5 h-5.5 stroke-[2.5]" />
                    </button>
                  </div>
                  <div
                    onClick={() => {
                      setTempPaymentMethod(selectedPaymentMethod);
                      setIsPaymentSelectionOpen(true);
                    }}
                    className="bg-white border border-slate-200/90 rounded-3xl p-4 flex items-center justify-between shadow-2xs cursor-pointer hover:border-slate-300 transition"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 text-xl shrink-0">
                        {selectedPaymentMethod === 'cash' ? '💵' : selectedPaymentMethod === 'card' ? '💳' : '📱'}
                      </div>
                      <span className="font-extrabold text-slate-950 text-base capitalize">
                        {selectedPaymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center font-mono">
                      <span className="font-black text-slate-950 text-base">
                        Tk {finalCheckoutPayable}
                      </span>
                    </div>
                  </div>
                </section>

                {/* 7. Order summary */}
                <section className="space-y-3 bg-white border border-slate-200/90 rounded-3xl p-4 shadow-2xs">
                  <h2 className="text-lg font-black text-slate-950 tracking-tight">
                    Order summary
                  </h2>

                  {/* Items list */}
                  <div className="space-y-2.5 pb-3 border-b border-slate-100">
                    {cart.map((item, idx) => {
                      const itemEffectivePrice = item.unitPrice ?? item.menuItem.price;
                      const itemSubtotal = itemEffectivePrice * item.quantity;
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 min-w-0 pr-2">
                            <span className="font-black text-slate-950 text-sm font-mono shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-slate-800 truncate">
                              {item.menuItem.name}
                            </span>
                          </div>
                          <span className="font-black text-slate-950 font-mono shrink-0">
                            Tk {itemSubtotal}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Price Calculation breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Subtotal</span>
                      <span className="font-mono font-bold">Tk {cartRegularTotal}</span>
                    </div>

                    {cartTotalSavings > 0 && (
                      <div className="flex justify-between text-[#e21b70] font-extrabold">
                        <span className="flex items-center space-x-1">
                          <span>Discounts</span>
                          <Info className="w-3.5 h-3.5 inline text-slate-400" />
                        </span>
                        <span className="font-mono">- Tk {cartTotalSavings}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>{deliveryOption === 'priority' ? 'Priority delivery' : 'Standard delivery'}</span>
                      <span className="font-extrabold text-[#e21b70] font-mono">
                        {deliveryOption === 'priority'
                          ? `Tk ${28 + deliveryFee}`
                          : (deliveryFee > 0 ? `Tk ${deliveryFee}` : 'Free')}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Platform Fee</span>
                      <span className="font-mono font-bold">Tk {platformFee}</span>
                    </div>

                    {riderTip > 0 && (
                      <div className="flex justify-between text-slate-800 font-semibold">
                        <span>Rider Tip</span>
                        <span className="font-mono font-bold">Tk {riderTip}</span>
                      </div>
                    )}
                  </div>

                  {/* Terms text */}
                  <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    By completing this order, I agree to all{' '}
                    <button
                      type="button"
                      onClick={() => alert('Terms & Conditions: 100% Cash on Delivery on arrival.')}
                      className="text-slate-900 font-extrabold underline underline-offset-2 hover:text-[#e21b70]"
                    >
                      terms & conditions
                    </button>
                    .
                  </p>
                </section>
              </div>

              {/* Sticky Bottom Bar */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 p-4 z-30 shadow-2xl">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-slate-950">
                        Total <span className="font-normal text-slate-500 text-xs">(incl. fees and tax)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBillSummary(s => !s)}
                        className="text-xs font-extrabold text-slate-950 underline underline-offset-2 hover:text-[#e21b70] transition block cursor-pointer"
                      >
                        See summary
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-[#e21b70] text-xl font-black font-mono">
                        Tk {finalCheckoutPayable}
                      </div>
                      {cartRegularTotal > cartSubtotal && (
                        <div className="text-xs font-semibold text-slate-400 line-through font-mono">
                          Tk {cartRegularTotal + platformFee + (deliveryOption === 'priority' ? 28 : deliveryFee) + riderTip}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPlacingOrder}
                    onClick={handlePlaceFinalOrder}
                    className="w-full py-4 bg-[#e21b70] hover:bg-[#c2135d] disabled:opacity-50 text-white font-extrabold text-base rounded-full shadow-lg shadow-pink-500/25 transition active:scale-[0.98] cursor-pointer text-center"
                  >
                    {isPlacingOrder ? 'Confirming Order...' : 'Place order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !isViewingCartDetail ? (
          // ========================================================================
          // ALL CARTS SUMMARY LIST VIEW (100% Matching Screenshot_20261029_163511_73a6044b.jpg)
          // ========================================================================
          <div className="min-h-screen bg-slate-50/50 pb-32 select-none">
            <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
              {/* Header Row: Back Arrow + All carts Title + Delivery Address */}
              <header className="flex items-center space-x-3 py-1">
                <button
                  type="button"
                  onClick={() => setActiveBottomNav('food')}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer shrink-0 active:scale-95"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
                    All carts
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                    Deliver to:{' '}
                    <span className="font-extrabold text-slate-900">
                      {activeCustomerAddress?.address_line || 'Select delivery address'}
                    </span>
                  </p>
                </div>
              </header>

              {cart.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center space-y-4 my-4 border border-slate-200/80 shadow-2xs">
                  <div className="w-20 h-20 bg-pink-50 text-[#e21b70] rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-pink-100">
                    <ShoppingBag className="w-10 h-10 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900">Your cart is empty</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Explore delicious food from restaurants and add your favorite dishes to your cart.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveBottomNav('food')}
                    className="px-6 py-3 bg-[#e21b70] hover:bg-[#c2135d] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md shadow-pink-500/20 active:scale-95 cursor-pointer inline-flex items-center space-x-2"
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Explore Restaurants</span>
                  </button>
                </div>
              ) : (
                /* Active Cart Card */
                <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3.5">
                  {/* Vendor Avatar/Logo, Name, ETA, Free delivery badge & Options */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Vendor Logo Circle */}
                      <div className="w-11 h-11 rounded-full bg-[#e21b70] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 overflow-hidden border border-pink-200">
                        {cartVendor?.logo_url ? (
                          <img
                            src={cartVendor.logo_url}
                            alt={cartVendor.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{(cartVendor?.name || 'S')[0]}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-black text-base text-slate-950 truncate leading-tight">
                          {cartVendor?.name || 'Special Bhai Bhai Biriyani House'}
                        </h3>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-semibold mt-1">
                          <span>
                            {(cartVendor?.estimated_prep_time_minutes || 20)}-
                            {(cartVendor?.estimated_prep_time_minutes || 20) + 15} mins
                          </span>
                          <span>•</span>
                          <span className="text-[#e21b70] font-black flex items-center space-x-0.5">
                            <Bike className="w-3.5 h-3.5 inline mr-0.5" />
                            <span>Free</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Options Button (...) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Clear items in cart?')) {
                          clearCart();
                        }
                      }}
                      className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition cursor-pointer shrink-0 shadow-2xs"
                      title="Cart options"
                    >
                      <MoreHorizontal className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  </div>

                  {/* Horizontal Dish Image Thumbnails Row + Plus Button */}
                  <div className="flex items-center space-x-2.5 overflow-x-auto py-1 no-scrollbar">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.menuItem.id}-${idx}`}
                        className="relative shrink-0"
                      >
                        <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-2xs">
                          <img
                            src={item.menuItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150'}
                            alt={item.menuItem.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150';
                            }}
                          />
                        </div>
                        {item.quantity > 1 && (
                          <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Plus button to add more dishes */}
                    {cartVendor && (
                      <button
                        type="button"
                        onClick={() => setSelectedVendorForMenuState(cartVendor)}
                        className="w-11 h-11 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition shrink-0 cursor-pointer shadow-2xs"
                        title="Add items"
                      >
                        <Plus className="w-5 h-5 stroke-[2.2]" />
                      </button>
                    )}
                  </div>

                  {/* Savings & Price Row */}
                  <div className="flex items-center justify-between pt-1">
                    {cartTotalSavings > 0 ? (
                      <div className="bg-[#fce7f3] text-[#e21b70] text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1 border border-pink-200/80">
                        <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Saving Tk{cartTotalSavings}</span>
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-baseline space-x-1.5 font-mono">
                      <span className="text-base font-black text-[#e21b70]">
                        Tk{cartSubtotal}
                      </span>
                      {cartRegularTotal > cartSubtotal && (
                        <span className="text-xs font-semibold text-slate-400 line-through">
                          Tk{cartRegularTotal}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View your cart button */}
                  <button
                    type="button"
                    onClick={() => setIsViewingCartDetail(true)}
                    className="w-full py-3 bg-[#e5e7eb] hover:bg-[#d1d5db] text-slate-900 font-extrabold text-sm rounded-2xl transition cursor-pointer shadow-2xs text-center active:scale-[0.98]"
                  >
                    View your cart
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // ========================================================================
          // DEDICATED CARTS DETAIL PAGE VIEW (Matching Screenshot_20261029_152222_33bbc37c.jpg)
          // ========================================================================
          <div className="min-h-screen bg-white pb-32 select-none">
            <div className="max-w-md mx-auto">
              {/* Top Header Row: Circular X Button + Cart Title & Restaurant Name */}
              <header className="px-4 pt-4 pb-3 flex items-center space-x-3.5 bg-white">
                <button
                  type="button"
                  onClick={() => setIsViewingCartDetail(false)}
                  className="w-11 h-11 rounded-full border border-slate-200/90 bg-white flex items-center justify-center text-slate-800 shadow-2xs hover:bg-slate-50 transition cursor-pointer shrink-0 active:scale-95"
                  title="Back to All Carts"
                >
                  <X className="w-5 h-5 stroke-[2.2]" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
                    Cart
                  </h1>
                  <p className="text-sm font-semibold text-slate-800 leading-tight truncate mt-0.5">
                    {cartVendor?.name || 'Special Bhai Bhai Biriyani House'}
                  </p>
                </div>
              </header>

              {cart.length === 0 ? (
                <div className="p-8 text-center space-y-4 my-8">
                  <div className="w-20 h-20 bg-pink-50 text-[#e21b70] rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-pink-100">
                    <ShoppingBag className="w-10 h-10 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900">Your cart is empty</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Explore delicious food from restaurants and add your favorite dishes to your cart.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewingCartDetail(false);
                      setActiveBottomNav('food');
                    }}
                    className="px-6 py-3 bg-[#e21b70] hover:bg-[#c2135d] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-md shadow-pink-500/20 active:scale-95 cursor-pointer inline-flex items-center space-x-2"
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Explore Restaurants</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {/* 1. Delivery / Pick-Up Pill Segmented Control */}
                  <div className="px-4">
                    <div className="bg-[#f3f4f6] p-1 rounded-full flex items-center relative">
                      {/* Delivery Pill */}
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`flex items-center justify-center space-x-2 py-2.5 px-6 rounded-full font-extrabold text-sm flex-1 transition-all cursor-pointer ${
                          orderType === 'delivery'
                            ? 'bg-[#0f172a] text-white shadow-sm'
                            : 'text-slate-800 hover:text-slate-950'
                        }`}
                      >
                        <Bike className="w-4 h-4 stroke-[2.5]" />
                        <span>Delivery</span>
                      </button>

                      {/* Pick-Up Pill */}
                      <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`flex items-center justify-center space-x-2 py-2.5 px-6 rounded-full font-extrabold text-sm flex-1 transition-all cursor-pointer relative ${
                          orderType === 'pickup'
                            ? 'bg-[#0f172a] text-white shadow-sm'
                            : 'text-slate-800 hover:text-slate-950'
                        }`}
                      >
                        <svg className="w-4 h-4 stroke-[2.4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="4" r="1.5" />
                          <path d="M10 21v-5l-2-2.5 1.5-3.5L14 12l2.5-1.5" />
                          <path d="m14 16 2 5" />
                          <path d="M8 12.5 6 15" />
                        </svg>
                        <span>Pick-Up</span>
                      </button>

                      {/* Floating 15% off badge above Pick-Up */}
                      <div className="absolute -top-2.5 right-10 sm:right-14 bg-[#fce7f3] text-[#e21b70] text-[10px] font-black px-2 py-0.5 rounded-full border border-pink-200 shadow-2xs pointer-events-none">
                        {cartVendor?.discount_percentage ? `${cartVendor.discount_percentage}% off` : '15% off'}
                      </div>
                    </div>
                  </div>

                  {/* 2. Delivery / Prep Time Card Pill & Address */}
                  <div className="px-4 space-y-2">
                    <div className="border border-slate-200/90 rounded-full px-5 py-3 flex items-center justify-between bg-white shadow-2xs">
                      <div className="text-sm text-slate-900 font-medium">
                        <span>{orderType === 'delivery' ? 'Delivery:' : 'Pick-Up:'} </span>
                        <span className="font-extrabold text-slate-950">
                          {orderType === 'delivery' 
                            ? `${(cartVendor?.estimated_prep_time_minutes || 20) + 15} - ${(cartVendor?.estimated_prep_time_minutes || 20) + 35} min`
                            : `${cartVendor?.estimated_prep_time_minutes || 20} min`
                          }
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="font-extrabold text-sm text-slate-950 underline underline-offset-4 hover:text-[#e21b70] transition cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {orderType === 'delivery' && (
                      <div className="border border-slate-200/80 rounded-2xl px-4 py-2.5 bg-slate-50 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <MapPin className="w-4 h-4 text-[#e21b70] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">
                              {activeCustomerAddress ? `${activeCustomerAddress.label || 'Home'}: ${activeCustomerAddress.address_line}` : 'Select Delivery Address'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddressModalOpen(true)}
                          className="text-xs font-bold text-[#e21b70] hover:underline shrink-0 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Items List with Dashed Dividers matching reference */}
                  <div className="px-5 bg-white pt-1">
                    {cart.map((item, cartIdx) => {
                      const itemVarKey = JSON.stringify(item.selectedVariations || []);
                      const itemEffectivePrice = item.unitPrice ?? item.menuItem.price;
                      const itemSubtotal = itemEffectivePrice * item.quantity;
                      const itemExtrasPrice = (item.selectedVariations || []).reduce((s, opt) => s + (Number(opt.price) || 0), 0);
                      const itemPricing = getItemPricing(item.menuItem, cartVendor, itemExtrasPrice);
                      const regularItemSubtotal = itemPricing.regularPrice * item.quantity;

                      return (
                        <div
                          key={`${item.menuItem.id}-${cartIdx}`}
                          className="flex items-start gap-3.5 py-4 border-b border-dashed border-slate-200"
                        >
                          {/* Circular Dish Image */}
                          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 shadow-2xs mt-0.5">
                            <img
                              src={item.menuItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150'}
                              alt={item.menuItem.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150';
                              }}
                            />
                          </div>

                          {/* Middle & Right Content */}
                          <div className="flex-1 min-w-0">
                            {/* Top row: Name on left, Discounted Price on right */}
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-extrabold text-[15px] text-slate-900 leading-snug">
                                {item.menuItem.name}
                              </h4>
                              <div className="text-[#e21b70] font-black text-base shrink-0 font-mono">
                                Tk {itemSubtotal}
                              </div>
                            </div>

                            {/* Options if present */}
                            {item.selectedVariations && item.selectedVariations.filter(v => v.groupName !== 'Frequently bought together').length > 0 && (
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {item.selectedVariations
                                  .filter(v => v.groupName !== 'Frequently bought together')
                                  .map(v => `${v.optionName}${v.price > 0 ? ` (+Tk ${v.price})` : ''}`)
                                  .join(', ')}
                              </p>
                            )}

                            {/* Bottom row: Stepper Pill Capsule on left, Regular Price (strikethrough) on right */}
                            <div className="flex items-center justify-between mt-2.5">
                              {/* Stepper Capsule */}
                              <div className="flex items-center space-x-3 rounded-full border border-slate-200/90 bg-white px-3 py-1 shadow-2xs">
                                {item.quantity === 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(item.menuItem.id, itemVarKey)}
                                    className="text-slate-800 hover:text-rose-600 transition cursor-pointer p-0.5"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(item.menuItem.id, item.quantity - 1, itemVarKey)}
                                    className="text-slate-800 hover:text-slate-950 transition cursor-pointer p-0.5"
                                    title="Decrease quantity"
                                  >
                                    <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
                                  </button>
                                )}
                                <span className="font-extrabold text-sm text-slate-950 min-w-[12px] text-center font-mono">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1, itemVarKey)}
                                  className="text-slate-800 hover:text-emerald-600 transition cursor-pointer p-0.5"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                                </button>
                              </div>

                              {/* Strikethrough regular price aligned with stepper */}
                              {itemPricing.hasDiscount && (
                                <div className="text-xs font-semibold text-slate-400 line-through font-mono">
                                  Tk {regularItemSubtotal}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Instructions & Note */}
                  <div className="px-5 pt-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Special instructions for restaurant / rider</span>
                    </div>
                    <input
                      type="text"
                      value={orderInstructions}
                      onChange={(e) => setOrderInstructions(e.target.value)}
                      placeholder="e.g. Less spicy, don't ring the bell, call upon arrival"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#e21b70] focus:ring-1 focus:ring-[#e21b70] outline-hidden text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  {/* Payment Method Badge */}
                  <div className="px-5 pt-1">
                    <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5">
                      <div className="flex items-center space-x-2 text-slate-800 font-bold">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>Payment Method</span>
                      </div>
                      <span className="font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full text-[11px]">
                        Cash on Delivery (COD)
                      </span>
                    </div>
                  </div>

                  {/* 4. Total Section */}
                  <div className="px-5 pt-2 pb-2 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-slate-950">
                          Total <span className="font-normal text-slate-500 text-xs">(incl. fees and tax)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowBillSummary(s => !s)}
                          className="text-xs font-extrabold text-slate-950 underline underline-offset-2 hover:text-[#e21b70] transition mt-1 block cursor-pointer"
                        >
                          See summary
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-[#e21b70] text-xl font-black font-mono">
                          Tk {totalCashPayable}
                        </div>
                        {totalDiscountSaved > 0 && (
                          <div className="text-xs font-semibold text-slate-400 line-through font-mono mt-0.5">
                            Tk {regularTotalWithFee}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Detailed Breakdown */}
                    {showBillSummary && (
                      <div className="mt-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs animate-in fade-in">
                        <div className="flex justify-between text-slate-600">
                          <span>Items Subtotal</span>
                          <span className="font-mono font-bold">Tk {regularFoodTotal}</span>
                        </div>
                        {totalDiscountSaved > 0 && (
                          <div className="flex justify-between text-[#e21b70] font-bold">
                            <span>Discount ({cartVendor?.discount_percentage || 15}% OFF)</span>
                            <span className="font-mono">-Tk {totalDiscountSaved}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                          <span>{orderType === 'delivery' ? 'Delivery Fee' : 'Pick-Up Service Fee'}</span>
                          <span className="font-mono font-bold">{deliveryFee > 0 ? `Tk ${deliveryFee}` : 'Free'}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                          <span>Total Payable</span>
                          <span className="text-[#e21b70] font-mono">Tk {totalCashPayable}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5. Checkout CTA Button */}
                  <div className="px-5 pt-3 pb-8 bg-white">
                    <button
                      type="button"
                      disabled={isPlacingOrder}
                      onClick={handleCheckout}
                      className="w-full py-4 bg-[#e21b70] hover:bg-[#c2135d] disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-pink-500/25 transition active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <span>{isPlacingOrder ? 'Confirming Order...' : 'Review payment and address'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
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
                  <MapPin className="w-5 h-5 text-white mt-0.5 fill-transparent stroke-[2.2] shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <h1 className="text-sm font-black tracking-tight text-white leading-tight">
                        Current Location
                      </h1>
                    </div>
                    <p className="text-[11px] text-orange-100 font-medium truncate max-w-[150px] sm:max-w-[200px]">
                      {activeCustomerAddress ? activeCustomerAddress.address_line : 'Select Address'}
                    </p>
                  </div>
                </div>

                {/* Address Book Pin Point Button */}
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="mr-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-black flex items-center space-x-1 border border-white/30 transition shadow-2xs active:scale-95 shrink-0 cursor-pointer"
                  title="Open Address Book to change map pin point"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[110px]">
                    {activeCustomerAddress ? activeCustomerAddress.label || 'At door' : 'At door'}
                  </span>
                </button>

                {/* Right: Fullscreen Toggle + Heart Icon (Favorites) */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button 
                    onClick={toggleFullscreen}
                    className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer active:scale-95"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View (ফুলস্ক্রিন ভিউ)"}
                    aria-label="Toggle Fullscreen"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-5 h-5 stroke-[2.2]" />
                    ) : (
                      <Maximize2 className="w-5 h-5 stroke-[2.2]" />
                    )}
                  </button>
                  <button 
                    onClick={() => setIsRating4PlusOnly(prev => !prev)}
                    className="p-1 text-white hover:text-orange-200 transition cursor-pointer active:scale-95"
                    aria-label="Favorites"
                  >
                    <Heart className={`w-6 h-6 stroke-[2.2] ${favorites.length > 0 ? 'fill-white' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search Bar (Inside the Orange Header directly below Location) */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
                <input
                  type="text"
                  placeholder="Search for restaurants and groceries"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white text-slate-800 placeholder:text-slate-400 rounded-full text-sm font-medium shadow-sm focus:outline-hidden"
                />
              </div>

              {/* 
                ======================================================================
                TOP 16:9 HERO BANNER AD CAROUSEL (INSIDE THE ORANGE WINDOW - ATTACHED & SEAMLESS)
                ======================================================================
              */}
              {heroSlides.length > 0 && (
                <div className="space-y-1.5 -mx-2 sm:-mx-3 pt-0">
                  <div className="relative overflow-hidden w-full aspect-[16/9] rounded-2xl sm:rounded-3xl border-0 shadow-xs bg-transparent">
                    <div 
                      className="w-full h-full relative bg-transparent"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {heroSlides.map((slide, i) => {
                        return (
                          <div 
                            key={slide.id}
                            style={getSlideStyle(i)}
                            className="absolute inset-0 w-full h-full select-none overflow-hidden rounded-2xl sm:rounded-3xl bg-transparent cursor-pointer"
                            onClick={() => {
                              if (slide.vendor) {
                                setSelectedVendorForMenu(slide.vendor);
                              }
                            }}
                          >
                            <img 
                              src={slide.image} 
                              alt={slide.title || 'Banner'} 
                              className="w-full h-full object-cover block transition-transform duration-500 hover:scale-102"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1280&h=720&auto=format&fit=crop&q=80';
                              }}
                            />

                            {/* Target Restaurant info pill if assigned */}
                            {slide.vendor && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVendorForMenu(slide.vendor!);
                                }}
                                className="absolute bottom-3 left-3 z-30 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black text-white flex items-center space-x-1.5 shadow-lg cursor-pointer hover:bg-black/90 transition select-none"
                              >
                                <span>🎯 {slide.vendor.name}</span>
                                <span className="text-[10px] text-orange-400 font-bold ml-1">View Menu &rarr;</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dots Carousel Indicator in translucent pill matching Screenshot */}
                  {heroSlides.length > 1 && (
                    <div className="flex justify-center pt-1.5">
                      <div className="bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
                        {heroSlides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSlide(idx)}
                            className={`transition-all duration-300 h-1.5 rounded-full cursor-pointer ${
                              activeSlide === idx 
                                ? 'w-5 bg-white' 
                                : 'w-1.5 bg-white/50 hover:bg-white/80'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* 
            ========================================================================
            MAIN BODY: EXACT FEATURES & OPTIONS WHERE THEY ARE IN THE SCREENSHOTS
            ========================================================================
          */}
          <main className="max-w-md mx-auto px-4 py-4 space-y-6">

            {/* 
              ======================================================================
              FIRST ROW: RESTAURANT TYPES LIST (Restaurant, Cloud Kitchen, Home Kitchen)
              ======================================================================
            */}
            {activeBottomNav === 'food' && (
              <section className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                    <span>🏪 Restaurant Types</span>
                  </h3>
                  {activeRestaurantTypeFilter !== 'All' && (
                    <button 
                      onClick={() => setActiveRestaurantTypeFilter('All')} 
                      className="text-[11px] font-bold text-orange-600 hover:underline cursor-pointer"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {/* Restaurant Type Filter Cards - 5 cards fitted in 1 single row without sliding */}
                <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
                  {[
                    { id: 'All', name: 'All', icon: '🍽️' },
                    { id: 'restaurant', name: 'Restaurant', icon: '🏬' },
                    { id: 'cloud_kitchen', name: 'Cloud Kitchen', icon: '🍳' },
                    { id: 'home_kitchen', name: 'Home Kitchen', icon: '🏠' },
                    { id: 'sweets_bakery', name: 'Sweets & Bakery', icon: '🧁' },
                  ].map((type) => {
                    const isSelected = activeRestaurantTypeFilter === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setActiveRestaurantTypeFilter(isSelected ? 'All' : type.id)}
                        className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl border transition-all cursor-pointer select-none min-w-0 w-full ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-200 ring-2 ring-orange-400 font-black'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-2xs font-bold'
                        }`}
                      >
                        <span className="text-base sm:text-lg mb-0.5">{type.icon}</span>
                        <span className="text-[9px] sm:text-[10px] leading-tight text-center font-bold px-0.5 break-words">
                          {type.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 
              ======================================================================
              MIDDLE SQUARE BANNER SECTION (NEW)
              ======================================================================
            */}
            {activeMiddleBanners.length > 0 && (
              <section className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                    <span>🔥 Featured Deals</span>
                  </h3>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none select-none">
                  {activeMiddleBanners.map((ad) => {
                    const targetVendorId = ad.target_vendor_id;
                    const targetVendor = targetVendorId 
                      ? vendors.find(v => v.id === targetVendorId || (v.unique_id && v.unique_id.toLowerCase() === targetVendorId.toLowerCase())) 
                      : null;
                    return (
                      <button
                        key={ad.id}
                        onClick={() => {
                          if (targetVendor) {
                            setSelectedVendorForMenu(targetVendor);
                          }
                        }}
                        className="relative w-28 sm:w-32 h-38 sm:h-44 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 shadow-xs border border-slate-100 hover:scale-102 transition-transform cursor-pointer focus:outline-hidden"
                      >
                        <img 
                          src={ad.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&auto=format&fit=crop&q=80'} 
                          alt="Featured Offer" 
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (img.src !== 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&auto=format&fit=crop&q=80') {
                              img.src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=600&auto=format&fit=crop&q=80';
                            }
                          }}
                        />
                        {/* Tiny target badge if any */}
                        {targetVendor && (
                          <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs py-1 px-1.5 rounded-xl text-[9px] font-black text-white text-center truncate">
                            {targetVendor.name}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

        {/* 
          ======================================================================
          SECOND ROW: FOOD CATEGORIES HORIZONTAL SLIDER
          (Pizza, Burgers, Chicken & Grill, Shawarma, Biryani, Kabab, Fast Food, etc. - dynamically managed by Admin)
          ======================================================================
        */}
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <span>🍕 {activeBottomNav === 'food' ? 'Food Categories' : 'Shop Categories'}</span>
            </h3>
            {activeCuisineFilter !== 'All' && (
              <button 
                onClick={() => setActiveCuisineFilter('All')} 
                className="text-[11px] font-bold text-orange-600 hover:underline"
              >
                Clear filter ({activeCuisineFilter})
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none select-none">
            {foodCategories.filter(cat => 
              cat.is_active !== false && 
              (activeBottomNav === 'food' ? (cat.category_type === 'food' || !cat.category_type) : cat.category_type === 'grocery')
            ).map((cat) => {
              const isSelected = activeCuisineFilter.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCuisineFilter(isSelected ? 'All' : cat.name)}
                  className={`flex flex-col items-center shrink-0 group cursor-pointer focus:outline-hidden transition-all ${
                    isSelected ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs transition-all border ${
                    isSelected 
                      ? 'ring-2 ring-orange-500 bg-orange-50 border-orange-300 shadow-orange-100' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}>
                    <span>{cat.icon || '🍽️'}</span>
                  </div>
                  <span className={`text-[11px] mt-1.5 font-bold whitespace-nowrap max-w-[76px] truncate text-center ${
                    isSelected ? 'text-orange-600 font-black' : 'text-slate-700'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. VERTICAL PROMOTIONAL DEAL POSTER CARDS - REMOVED AS REQUESTED */}
        
        {/* 5. POPULAR RESTAURANTS SECTION - REMOVED AS REQUESTED */}
        
        {/* 6. DISHES UP TO 15% OFF SECTION - REMOVED AS REQUESTED */}
        
        {/* 7. PROMO BANNER - REMOVED AS REQUESTED */}

        {/* 8. SHOP BY CATEGORY SECTION - REMOVED AS REQUESTED */}

        {/* 9. STICKY FILTER CHIPS BAR (Visible ONLY on Food page) */}
        {activeBottomNav === 'food' && (
          <section className="sticky top-0 z-30 bg-white/95 py-2 flex items-center justify-start space-x-2 border-b border-slate-100 w-full max-w-full px-0.5 overflow-x-auto scrollbar-none">
            {/* 3-Dot / Sliders Icon Button (Brought back as requested, list popup disabled) */}
            <div 
              className="p-1.5 rounded-full border border-slate-200 text-slate-700 shadow-2xs shrink-0 bg-white flex items-center justify-center"
              title="Filter Icon"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-700" />
            </div>

            {/* Sort Button (ONLY clicking Sort opens the list modal) */}
            <button
              onClick={() => setIsSortMenuOpen(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer ${
                selectedSort === 'new' || selectedSort === 'distance' ? 'bg-orange-600 text-white border-orange-600 shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>
                {selectedSort === 'new' ? 'Sort: New' : selectedSort === 'distance' ? 'Sort: Distance' : 'Sort'}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>


            {/* Ratings 4.0+ Chip */}
            <button
              onClick={() => setIsRating4PlusOnly(prev => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shrink-0 transition flex items-center gap-1 cursor-pointer ${
                isRating4PlusOnly ? 'bg-orange-600 text-white border-orange-600 shadow-2xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Ratings 4.0+</span>
            </button>
          </section>
        )}

        {/* Sort Options Modal (ONLY New Vendors & Nearest Distance - Instant close without lingering blur) */}
        {isSortMenuOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50" 
            onClick={() => setIsSortMenuOpen(false)}
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">Sort Vendors By</h3>
                <button 
                  onClick={() => setIsSortMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                {/* 1. New Vendors */}
                <button
                  onClick={() => { 
                    if (selectedSort === 'new') {
                      setSelectedSort('popular'); 
                      setIsNewOnly(false);
                    } else {
                      setSelectedSort('new'); 
                      setIsNewOnly(true); 
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                    selectedSort === 'new' || isNewOnly ? 'bg-orange-50 text-orange-600 border-2 border-orange-500 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>New Vendors</span>
                  </div>
                  {(selectedSort === 'new' || isNewOnly) && <Check className="w-5 h-5 text-orange-600 stroke-[3]" />}
                </button>

                {/* 2. Nearest Distance */}
                <button
                  onClick={() => { 
                    if (selectedSort === 'distance') {
                      setSelectedSort('popular'); 
                    } else {
                      setSelectedSort('distance'); 
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                    selectedSort === 'distance' ? 'bg-orange-50 text-orange-600 border-2 border-orange-500 shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span>Nearest Distance</span>
                  </div>
                  {selectedSort === 'distance' && <Check className="w-5 h-5 text-orange-600 stroke-[3]" />}
                </button>
              </div>

              {/* APPLY FILTERS Button (Matching Screenshot) */}
              <button 
                onClick={() => setIsSortMenuOpen(false)}
                className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-[0.99] mt-2"
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        )}

        {/* 10. EXPLORE RESTAURANTS/SHOPS NEARBY (Matching Screenshot 4 & 5) */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {activeBottomNav === 'food' ? 'Explore restaurants nearby' : 'Explore shops nearby'}
          </h2>

          {displayVendors.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/90 shadow-xs space-y-3.5 my-2">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto border border-orange-100 shadow-inner">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  No {activeBottomNav === 'food' ? 'restaurants' : 'shops'} available in {activeCustomerZone?.name || 'this zone'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Only vendors within your active delivery zone boundary are displayed. Please change your delivery address or map pin to browse vendors in other zones.
                </p>
              </div>
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-orange-600/20 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                <span>CHANGE DELIVERY ADDRESS / ZONE</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayVendors.map((vendor) => {
                const { lat: vLat, lng: vLng } = getVendorCoords(vendor);
                const distanceKm = calculateDistanceKm(vLat, vLng, customerLat, customerLng);
                const isFreeDelivery = Boolean(vendor.is_free_delivery);
                const fee = isFreeDelivery ? 0 : calculateDeliveryFee(distanceKm, settings.base_delivery_charge, settings.per_km_delivery_charge);
                const isFav = favorites.includes(vendor.id);
                const isNew = isVendorNew(vendor);

                return (
                  <div
                    key={vendor.id}
                    onClick={() => setSelectedVendorForMenu(vendor)}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="relative w-full aspect-[16/9] bg-slate-100 overflow-hidden">
                      <img 
                        src={vendor.cover_image} 
                        alt={vendor.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* NEW Badge & Free Delivery Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 items-start">
                        {isNew && (
                          <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center space-x-1 border border-emerald-400/40">
                            <Sparkles className="w-3 h-3 fill-amber-300 text-amber-300" />
                            <span>NEW</span>
                          </span>
                        )}
                        {isFreeDelivery && (
                          <span className="px-2.5 py-1 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center space-x-1 border border-orange-400/40">
                            <Bike className="w-3 h-3 text-white" />
                            <span>FREE DELIVERY</span>
                          </span>
                        )}
                      </div>

                      <button 
                        type="button"
                        onClick={(e) => toggleFavorite(vendor.id, e)}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-full shadow-md text-slate-700 hover:text-rose-500 transition z-10"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div className="p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">{vendor.name}</h3>
                        <div className="flex items-center space-x-1 text-xs font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{vendor.rating} (500+)</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        From {vendor.estimated_prep_time_minutes} min &bull; ৳ &bull; {vendor.cuisine} &bull; Price Match
                      </p>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center space-x-2 text-xs">
                          {isFreeDelivery ? (
                            <span className="text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              <Bike className="w-3.5 h-3.5 text-emerald-600" /> Free Delivery ({distanceKm} km)
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">Delivery: {settings.currency_symbol}{fee} ({distanceKm} km)</span>
                          )}
                        </div>

                        {Boolean((vendor.discount_title && String(vendor.discount_title).trim() && vendor.discount_title !== 'null' && vendor.discount_title !== 'undefined') || (vendor.discount_percentage && Number(vendor.discount_percentage) > 0)) && (
                          <div className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-lg border border-rose-200 text-[10px] font-black w-fit">
                            <Tag className="w-3 h-3" />
                            <span>{(vendor.discount_title && vendor.discount_title !== 'null' && vendor.discount_title !== 'undefined') ? vendor.discount_title : `${vendor.discount_percentage}% OFF`}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <span className="text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                          View Menu &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
        </>
      )}

      {/* 
        ========================================================================
        RESTAURANT MENU MODAL (100% Matching Screenshot 2-Column Grid & Cart Bar)
        ========================================================================
      */}
      <AnimatePresence>
      {selectedVendorForMenu && (
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden overscroll-none touch-pan-y"
        >
          {/* Main Scrollable Content */}
          <div 
            ref={menuScrollContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain scrollbar-none pb-36"
          >
            {/* 1. Header Cover Area */}
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 shrink-0">
              <img 
                src={selectedVendorForMenu.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'} 
                alt={selectedVendorForMenu.name}
                className="w-full h-full object-cover"
              />

              {/* Top Navigation Overlay */}
              <div className="absolute top-3.5 inset-x-4 flex items-center justify-between z-40">
                <button 
                  onClick={() => setSelectedVendorForMenu(null)}
                  className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-md text-slate-900 active:scale-90 transition-transform cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setIsRestaurantReviewsOpen(true)}
                    className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-md text-slate-900 active:scale-90 transition-transform cursor-pointer"
                    title="Ratings & Info"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => toggleFavorite(selectedVendorForMenu.id, e)}
                    className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-md text-slate-900 cursor-pointer"
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(selectedVendorForMenu.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: selectedVendorForMenu.name, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert('✅ Restaurant link copied to clipboard!');
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-md text-slate-900 active:scale-90 transition-transform cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Restaurant Info Section with Overlapping Vendor Profile Photo */}
            <div className="relative px-6 pb-4 text-center">
              {/* Overlapping Profile Photo (Exact same position as example image with hairline 1px border) */}
              <div className="relative -mt-9 sm:-mt-10 flex justify-center z-20 mb-3">
                <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-slate-100 shadow-lg shadow-black/15 border border-white shrink-0">
                  <img
                    src={selectedVendorForMenu.logo_url || selectedVendorForMenu.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300'}
                    alt={selectedVendorForMenu.name}
                    className="w-full h-full object-cover block"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (selectedVendorForMenu.cover_image && img.src !== selectedVendorForMenu.cover_image) {
                        img.src = selectedVendorForMenu.cover_image;
                      }
                    }}
                  />
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {selectedVendorForMenu.name}
              </h3>
              <div className="flex flex-col items-center gap-2 mt-1">
                <div 
                  onClick={() => setIsRestaurantReviewsOpen(true)}
                  className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-600 cursor-pointer hover:opacity-85 transition group active:scale-95 py-0.5 px-2 rounded-full hover:bg-slate-50 select-none"
                  title="View Ratings & Reviews"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-slate-900 font-black">
                    {selectedVendorForMenu.rating ? selectedVendorForMenu.rating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-slate-500 font-semibold">(500+ ratings)</span>
                </div>

                {Boolean((selectedVendorForMenu.discount_title && String(selectedVendorForMenu.discount_title).trim() && selectedVendorForMenu.discount_title !== 'null' && selectedVendorForMenu.discount_title !== 'undefined') || (selectedVendorForMenu.discount_percentage && Number(selectedVendorForMenu.discount_percentage) > 0)) && (
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black px-3 py-1 rounded-full shadow-2xs">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {(selectedVendorForMenu.discount_title && selectedVendorForMenu.discount_title !== 'null' && selectedVendorForMenu.discount_title !== 'undefined') 
                        ? selectedVendorForMenu.discount_title 
                        : `${selectedVendorForMenu.discount_percentage}% OFF on all menu items`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Sticky Search & Category Bar */}
            <div className={`sticky top-0 z-30 transition-colors duration-300 ${isMenuHeaderSticky ? 'bg-white shadow-md' : 'bg-white border-b border-slate-100'}`}>
              {/* Search Menu Bar */}
              <div className="px-5 py-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search menu"
                    value={menuSearchQuery}
                    onChange={(e) => setMenuSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-2xl text-xs font-bold placeholder:text-slate-400 focus:ring-0"
                  />
                </div>
              </div>

              {/* Categories Horizontal Scroll Tabs */}
              <div className="px-5 py-1.5 overflow-x-auto scrollbar-none flex items-center space-x-6 border-t border-slate-100">
                {['Popular', ...new Set(menuItems.filter(m => m.vendor_id === selectedVendorForMenu.id).map(m => m.category))].map((cat) => {
                  const isSelected = activeMenuCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => scrollToCategory(cat)}
                      className={`whitespace-nowrap pb-2 text-xs font-extrabold transition-all relative cursor-pointer ${
                        isSelected ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {cat}
                      {isSelected && (
                        <motion.div 
                          layoutId="cat-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Menu Sections (Row List Layout matching view cart reference) */}
            <div className="px-4 pt-4 pb-24 space-y-7">
              {/* Popular Section */}
              <div 
                ref={(el) => { categorySectionRefs.current['Popular'] = el; }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 pb-1">
                  <Flame className="w-5 h-5 text-rose-600 fill-rose-600" />
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Popular</h4>
                    <p className="text-[11px] font-medium text-slate-500">Most ordered right now</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3.5 gap-y-5">
                  {menuItems
                    .filter((m) => {
                      if (m.vendor_id !== selectedVendorForMenu.id) return false;
                      if (!menuSearchQuery.trim()) return true;
                      const q = menuSearchQuery.trim().toLowerCase();
                      return m.name.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q));
                    })
                    .slice(0, 6)
                    .map((dish) => {
                      const cartItem = cart.find(ci => ci.menuItem.id === dish.id);
                      const pricing = getItemPricing(dish, selectedVendorForMenu);
                      const popPercent = 30 + ((dish.name.length * 7 + Math.round(dish.price || 100)) % 45);

                      return (
                        <div 
                          key={dish.id} 
                          onClick={() => handleOpenMenuItemModal(dish)}
                          className="flex flex-col cursor-pointer group active:scale-[0.98] transition-transform select-none"
                        >
                          {/* Rounded Image Container with Circular Plus Button in Bottom-Right Corner */}
                          <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-2xs border border-slate-200/80">
                            <img 
                              src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
                              alt={dish.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Discount Badge on Top-Left Corner if applicable */}
                            {pricing.hasDiscount && (
                              <div className="absolute top-2.5 left-2.5 bg-[#e21b70] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                                -{pricing.discountPercent}%
                              </div>
                            )}

                            {/* Bottom Right Floating Plus / Stepper Button */}
                            <div 
                              className="absolute bottom-2.5 right-2.5 z-10" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              {cartItem ? (
                                <div className="flex items-center space-x-1.5 rounded-full border border-slate-200/90 bg-white/95 backdrop-blur-xs px-2.5 py-1 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(dish.id, cartItem.quantity - 1)}
                                    className="text-slate-800 hover:text-rose-600 transition cursor-pointer p-0.5"
                                    title="Decrease quantity"
                                  >
                                    {cartItem.quantity === 1 ? (
                                      <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                                    ) : (
                                      <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
                                    )}
                                  </button>
                                  <span className="font-black text-xs text-slate-950 min-w-[12px] text-center font-mono">
                                    {cartItem.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMenuItemModal(dish)}
                                    className="text-slate-800 hover:text-emerald-600 transition cursor-pointer p-0.5"
                                    title="Add more"
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenMenuItemModal(dish)}
                                  className="w-10 h-10 rounded-full bg-white text-slate-900 shadow-md border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition active:scale-90 cursor-pointer"
                                  title="Add to cart"
                                >
                                  <Plus className="w-5 h-5 stroke-[2.8]" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dish Info Below Image */}
                          <div className="pt-2.5 space-y-0.5">
                            <h4 className="font-extrabold text-sm sm:text-base text-slate-950 leading-snug group-hover:text-[#e21b70] transition-colors line-clamp-2">
                              {dish.name}
                            </h4>

                            {/* Price Row: from Tk 176 Tk 200 */}
                            <div className="flex items-baseline space-x-1.5 font-mono flex-wrap">
                              <span className="text-[#e21b70] font-black text-sm sm:text-base">
                                from {settings.currency_symbol || 'Tk'} {pricing.discountedPrice}
                              </span>
                              {pricing.hasDiscount && (
                                <span className="text-xs font-bold text-slate-400 line-through">
                                  {settings.currency_symbol || 'Tk'} {pricing.regularPrice}
                                </span>
                              )}
                            </div>

                            {/* Thumbs up popularity percentage badge */}
                            <div className="flex items-center space-x-1 text-xs font-black text-slate-800 pt-0.5">
                              <span>👍</span>
                              <span>{popPercent}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* All Other Categories */}
              {[...new Set(menuItems.filter(m => m.vendor_id === selectedVendorForMenu.id).map(m => m.category))].map((cat) => (
                <div 
                  key={cat}
                  ref={(el) => { categorySectionRefs.current[cat] = el; }}
                  className="space-y-3 border-t border-slate-100 pt-5"
                >
                  <h4 className="text-base font-extrabold text-slate-900 pb-1">{cat}</h4>
                  <div className="grid grid-cols-2 gap-x-3.5 gap-y-5">
                    {menuItems
                      .filter(m => {
                        if (m.vendor_id !== selectedVendorForMenu.id || m.category !== cat) return false;
                        if (!menuSearchQuery.trim()) return true;
                        const q = menuSearchQuery.trim().toLowerCase();
                        return m.name.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q));
                      })
                      .map((dish) => {
                        const cartItem = cart.find(ci => ci.menuItem.id === dish.id);
                        const pricing = getItemPricing(dish, selectedVendorForMenu);
                        const popPercent = 30 + ((dish.name.length * 7 + Math.round(dish.price || 100)) % 45);

                        return (
                          <div 
                            key={dish.id} 
                            onClick={() => handleOpenMenuItemModal(dish)}
                            className="flex flex-col cursor-pointer group active:scale-[0.98] transition-transform select-none"
                          >
                            {/* Rounded Image Container with Circular Plus Button in Bottom-Right Corner */}
                            <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-2xs border border-slate-200/80">
                              <img 
                                src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'} 
                                alt={dish.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />

                              {/* Discount Badge on Top-Left Corner if applicable */}
                              {pricing.hasDiscount && (
                                <div className="absolute top-2.5 left-2.5 bg-[#e21b70] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                                  -{pricing.discountPercent}%
                                </div>
                              )}

                              {/* Bottom Right Floating Plus / Stepper Button */}
                              <div 
                                className="absolute bottom-2.5 right-2.5 z-10" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cartItem ? (
                                  <div className="flex items-center space-x-1.5 rounded-full border border-slate-200/90 bg-white/95 backdrop-blur-xs px-2.5 py-1 shadow-lg">
                                    <button
                                      type="button"
                                      onClick={() => updateCartQuantity(dish.id, cartItem.quantity - 1)}
                                      className="text-slate-800 hover:text-rose-600 transition cursor-pointer p-0.5"
                                      title="Decrease quantity"
                                    >
                                      {cartItem.quantity === 1 ? (
                                        <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                                      ) : (
                                        <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
                                      )}
                                    </button>
                                    <span className="font-black text-xs text-slate-950 min-w-[12px] text-center font-mono">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenMenuItemModal(dish)}
                                      className="text-slate-800 hover:text-emerald-600 transition cursor-pointer p-0.5"
                                      title="Add more"
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMenuItemModal(dish)}
                                    className="w-10 h-10 rounded-full bg-white text-slate-900 shadow-md border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition active:scale-90 cursor-pointer"
                                    title="Add to cart"
                                  >
                                    <Plus className="w-5 h-5 stroke-[2.8]" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Dish Info Below Image */}
                            <div className="pt-2.5 space-y-0.5">
                              <h4 className="font-extrabold text-sm sm:text-base text-slate-950 leading-snug group-hover:text-[#e21b70] transition-colors line-clamp-2">
                                {dish.name}
                              </h4>

                              {/* Price Row: from Tk 176 Tk 200 */}
                              <div className="flex items-baseline space-x-1.5 font-mono flex-wrap">
                                <span className="text-[#e21b70] font-black text-sm sm:text-base">
                                  from {settings.currency_symbol || 'Tk'} {pricing.discountedPrice}
                                </span>
                                {pricing.hasDiscount && (
                                  <span className="text-xs font-bold text-slate-400 line-through">
                                    {settings.currency_symbol || 'Tk'} {pricing.regularPrice}
                                  </span>
                                )}
                              </div>

                              {/* Thumbs up popularity percentage badge */}
                              <div className="flex items-center space-x-1 text-xs font-black text-slate-800 pt-0.5">
                                <span>👍</span>
                                <span>{popPercent}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Floating 'View your cart' Bar when cart has items from this vendor */}
            {totalCartCount > 0 && cartVendor?.id === selectedVendorForMenu.id && (
              <div className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-md mx-auto pointer-events-none">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVendorForMenu(null);
                    setActiveBottomNav('carts');
                  }}
                  className="w-full bg-[#e21b70] hover:bg-[#c2135d] text-white font-extrabold py-3.5 px-5 rounded-2xl shadow-xl shadow-pink-500/30 flex items-center justify-between transition-all active:scale-[0.98] pointer-events-auto cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-black text-xs font-mono">
                      {totalCartCount}
                    </div>
                    <span className="text-sm font-black tracking-tight">View your cart</span>
                  </div>
                  <span className="font-mono font-black text-base">
                    {settings.currency_symbol || 'Tk'} {foodTotal}
                  </span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* 
        ========================================================================
        ADDRESS BOOK MODAL
        ========================================================================
      */}
      <AddressBookModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />

      {/* RATINGS & REVIEWS MODAL (100% Matching Screenshot 2) */}
      {isRestaurantReviewsOpen && selectedVendorForMenu && (
        <CustomerRestaurantReviewsModal
          vendor={selectedVendorForMenu}
          onClose={() => setIsRestaurantReviewsOpen(false)}
          onNavigateToOrders={() => {
            setIsRestaurantReviewsOpen(false);
            setSelectedVendorForMenu(null);
            setActiveBottomNav('orders');
          }}
        />
      )}

      {/* MODAL: RATE & REVIEW DELIVERED ORDER */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-black text-slate-900 text-base">Rate & Review Order</h3>
              </div>
              <button
                onClick={() => setSelectedOrderForReview(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order & Vendor Summary */}
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-slate-800">
                <span className="truncate">{selectedOrderForReview.vendor?.name || 'Restaurant'}</span>
                <span className="font-mono text-amber-800">#{selectedOrderForReview.order_code}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {(selectedOrderForReview.items || []).map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!reviewComment.trim()) return;
                setIsSubmittingReview(true);
                try {
                  await addOrderReview({
                    vendor_id: selectedOrderForReview.vendor_id,
                    order_id: selectedOrderForReview.id,
                    order_code: selectedOrderForReview.order_code,
                    customer_id: currentUser?.id,
                    customer_name: currentUser?.name || selectedOrderForReview.customer_name || 'Customer',
                    customer_phone: currentUser?.phone || selectedOrderForReview.customer_phone,
                    rating: reviewRating,
                    comment: reviewComment.trim(),
                    mentioned_items: selectedMentionedDishes
                  });
                  setReviewSuccessMessage(`Review submitted for #${selectedOrderForReview.order_code}!`);
                  setSelectedOrderForReview(null);
                  setReviewComment('');
                  setSelectedMentionedDishes([]);
                  setTimeout(() => setReviewSuccessMessage(null), 4000);
                } finally {
                  setIsSubmittingReview(false);
                }
              }}
              className="space-y-3.5"
            >
              {/* Star rating selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">How was your food & experience?</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition active:scale-90"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-slate-800 ml-2">
                    {reviewRating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Mention/Tag ordered menu items */}
              {selectedOrderForReview.items && selectedOrderForReview.items.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mention Dishes in Review (Tap to select):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrderForReview.items.map((it, idx) => {
                      const isSelected = selectedMentionedDishes.includes(it.item_name);
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setSelectedMentionedDishes(prev => 
                              prev.includes(it.item_name)
                                ? prev.filter(name => name !== it.item_name)
                                : [...prev, it.item_name]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <span>{it.item_name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feedback Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Review *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us about the taste, packaging, and portion size..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForReview(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE / SETTINGS MODAL */}
      {(isEditProfileOpen || isSettingsModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {profileOtpStep === 'otp_required' 
                  ? 'Verify with OTP' 
                  : (isEditProfileOpen ? 'User Profile' : 'Account Settings')}
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsEditProfileOpen(false);
                  setIsSettingsModalOpen(false);
                  setProfileOtpStep('idle');
                  setProfileSaveFeedback(null);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            {profileOtpStep === 'idle' ? (
              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl space-y-1">
                  <p className="font-bold text-slate-700">💡 Security Rules:</p>
                  <p>• <span className="font-semibold text-emerald-700">Display Name:</span> updates directly without OTP.</p>
                  <p>• <span className="font-semibold text-amber-700">Phone or Password:</span> requires SMS OTP verification.</p>
                </div>

                {profileSaveFeedback && (
                  <div className={`p-2.5 rounded-xl text-center font-bold text-xs ${
                    profileSaveFeedback.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {profileSaveFeedback.message}
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditProfileOpen(false);
                      setIsSettingsModalOpen(false);
                      setProfileSaveFeedback(null);
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingProfile ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200/70 p-3 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">OTP Verification Required</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      An OTP code was sent to <span className="font-bold text-slate-900">{profileTargetPhone}</span> to confirm your phone/password update.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyProfileOtp} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Enter OTP Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      required
                      maxLength={6}
                      value={profileOtpCode}
                      onChange={(e) => setProfileOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 4-6 digit OTP"
                      className="w-full text-center text-lg font-black tracking-widest px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={handleResendProfileOtp}
                      disabled={profileOtpTimer > 0 || isSavingProfile}
                      className="font-bold text-orange-600 hover:text-orange-700 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {profileOtpTimer > 0 ? `Resend OTP (${profileOtpTimer}s)` : 'Resend OTP'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOtpStep('idle');
                        setProfileSaveFeedback(null);
                      }}
                      className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                    >
                      Back to edit
                    </button>
                  </div>

                  {profileSaveFeedback && (
                    <div className={`p-2.5 rounded-xl text-center font-bold text-xs ${
                      profileSaveFeedback.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {profileSaveFeedback.message}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditProfileOpen(false);
                        setIsSettingsModalOpen(false);
                        setProfileOtpStep('idle');
                        setProfileSaveFeedback(null);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile || !profileOtpCode.trim()}
                      className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isSavingProfile ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify & Update</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Log out from foodiplace?</h3>
                <p className="text-xs text-slate-500">You can log back in at any time</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to log out of your account?
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logoutUser();
                  setIsLogoutConfirmOpen(false);
                  setActiveBottomNav('food');
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMenuItemForModal && selectedVendorForMenu && (
        <div 
          onClick={() => setSelectedMenuItemForModal(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 overscroll-contain"
        >
          {/* Main Modal Card Container */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh] relative animate-in slide-in-from-bottom-6 duration-300"
          >
            
            {/* Top Fixed Aspect Banner Image Header (16:9 fixed cover photo banner) */}
            <div className="relative w-full aspect-[16/9] bg-slate-100 shrink-0 overflow-hidden border-b border-slate-200">
              <img
                src={selectedMenuItemForModal.image_url || selectedVendorForMenu?.cover_image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800'}
                alt={selectedMenuItemForModal.name}
                className="w-full h-full object-cover block absolute inset-0"
                onError={(e) => {
                  e.currentTarget.src = selectedVendorForMenu?.cover_image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800';
                }}
              />

              {/* Floating Top Left Pill Badge */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-lg flex items-center gap-1.5 border border-slate-200/80 z-20">
                <Sparkles className="w-3 h-3 text-orange-600 fill-orange-600" />
                <span>Customize Item</span>
              </div>

              {/* Floating Top Right Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMenuItemForModal(null)}
                className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/95 text-slate-900 border border-slate-200 hover:bg-white flex items-center justify-center transition cursor-pointer shadow-xl active:scale-90"
                title="Close"
              >
                <X className="w-5 h-5 stroke-[2.8]" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div ref={modalScrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
              
              {/* Item Info Card: Name, Description, Price */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug break-words">
                  {selectedMenuItemForModal.name || 'Delicious Dish'}
                </h2>
                
                {/* Description directly under Item Name */}
                {isValidDescription(selectedMenuItemForModal.description) ? (
                  <p className="text-xs text-slate-600 leading-relaxed font-normal break-words">
                    {selectedMenuItemForModal.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic leading-relaxed font-normal">
                    Freshly prepared with authentic recipes and ingredients.
                  </p>
                )}

                {/* Price & Rating */}
                <div className="pt-1 flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="text-base font-black text-[#d70f64] font-mono">
                    Tk {modalPricing.discountedPrice}
                  </span>
                  {modalPricing.hasDiscount && (
                    <>
                      <span className="text-xs text-slate-400 line-through font-semibold font-mono">
                        Tk {modalPricing.regularPrice}
                      </span>
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                        -{modalPricing.discountPercent}%
                      </span>
                    </>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-700">👍 95%</span>
                </div>
              </div>

              {/* Variations & Portions / Add-ons matching Foodpanda Style */}
              {(() => {
                const effectiveVariations = getItemEffectiveVariations(selectedMenuItemForModal);
                if (effectiveVariations.length === 0) return null;

                return (
                  <div className="space-y-4">
                    {effectiveVariations.map((group, groupIdx) => {
                      const groupKey = group.id || group.name;
                      const gNameLower = group.name.toLowerCase();
                      const isPortionOrSize = gNameLower.includes('portion') || gNameLower.includes('size') || gNameLower.includes('variation') || gNameLower.includes('half') || gNameLower.includes('full');

                      return (
                        <div key={groupKey} className="space-y-2.5">
                          {/* Group Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                              <h3 className="font-black text-sm text-slate-900 tracking-tight">
                                {group.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 font-medium">
                                Select multiple options if needed
                              </p>
                            </div>
                            <span className="bg-slate-100 text-slate-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                              Optional
                            </span>
                          </div>

                          {/* Options List */}
                          <div className="space-y-2">
                            {group.options.map((opt) => {
                              const optKey = `${groupKey}_${opt.name}`;
                              const isSelected = Object.values(selectedModalVariations).some(sel => 
                                sel.groupName === group.name && sel.optionName === opt.name
                              );
                              const optionPriceNum = opt.price !== undefined ? Number(opt.price) : 0;

                              return (
                                <div
                                  key={opt.id || opt.name}
                                  onClick={() => {
                                    setSelectedModalVariations(prev => {
                                      const next = { ...prev };
                                      const existingKey = Object.keys(next).find(k => 
                                        next[k].groupName === group.name && next[k].optionName === opt.name
                                      );
                                      if (existingKey) {
                                        delete next[existingKey];
                                      } else {
                                        next[optKey] = {
                                          groupName: group.name,
                                          optionName: opt.name,
                                          price: optionPriceNum
                                        };
                                      }
                                      return next;
                                    });
                                  }}
                                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition cursor-pointer select-none"
                                >
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <h4 className="font-extrabold text-xs text-slate-900">{opt.name}</h4>
                                      <div className="flex items-center space-x-1.5 font-mono text-xs mt-0.5">
                                        <span className="font-black text-[#d70f64]">
                                          + Tk {optionPriceNum}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Checkbox Indicator */}
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                                    isSelected ? 'border-[#d70f64] bg-[#d70f64]' : 'border-slate-300 bg-white'
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Optional Recommendations (Frequently bought together from selected recommendation category) */}
              {selectedMenuItemForModal.recommendation_category && (
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 tracking-tight">
                        Frequently bought together
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Other customers also ordered these from {selectedMenuItemForModal.recommendation_category}
                      </p>
                    </div>
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">
                      Optional
                    </span>
                  </div>

                  <div className="space-y-2">
                    {menuItems
                      .filter(m => m.vendor_id === selectedVendorForMenu.id && m.category === selectedMenuItemForModal.recommendation_category && m.id !== selectedMenuItemForModal.id)
                      .map((recItem) => {
                        const recKey = `rec_${recItem.id}`;
                        const isSelected = Boolean(selectedModalVariations[recKey]);
                        const recPricing = getItemPricing(recItem, selectedVendorForMenu);

                        return (
                          <div
                            key={recItem.id}
                            onClick={() => {
                              setSelectedModalVariations(prev => {
                                const next = { ...prev };
                                if (isSelected) {
                                  delete next[recKey];
                                } else {
                                  next[recKey] = {
                                    groupName: 'Frequently bought together',
                                    optionName: recItem.name,
                                    price: recPricing.discountedPrice
                                  };
                                }
                                return next;
                              });
                            }}
                            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                                <img
                                  src={recItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                                  alt={recItem.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900">{recItem.name}</h4>
                                <div className="flex items-center space-x-1.5 font-mono text-xs mt-0.5">
                                  <span className="font-black text-[#d70f64]">
                                    + Tk {recPricing.discountedPrice}
                                  </span>
                                  {recPricing.hasDiscount && (
                                    <span className="text-[10px] text-slate-400 line-through">Tk {recPricing.regularPrice}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                              isSelected ? 'border-[#d70f64] bg-[#d70f64]' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Special Instructions Input - Compact */}
              <div className="space-y-1">
                <label className="font-extrabold text-xs text-slate-900 block">
                  Special instructions (optional)
                </label>
                <textarea
                  maxLength={200}
                  value={modalSpecialInstructions}
                  onChange={(e) => setModalSpecialInstructions(e.target.value)}
                  placeholder="e.g. no mayo, less spicy"
                  className="w-full text-xs p-2 border border-slate-200 bg-slate-50 rounded-xl focus:outline-hidden focus:border-[#d70f64] focus:bg-white font-medium resize-none"
                  rows={2}
                />
              </div>

              {/* Unavailable Preference Row */}
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-600 font-bold">If item unavailable:</span>
                <button
                  type="button"
                  onClick={() => setIsUnavailPopupOpen(true)}
                  className="font-black text-[#d70f64] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>{unavailPreference === 'remove' ? 'Remove from order' : 'Call me'}</span>
                  <span>&gt;</span>
                </button>
              </div>
            </div>

            {/* Bottom Quantity & Add to Cart Action Fixed Footer */}
            <div className="shrink-0 bg-white border-t border-slate-100 p-3.5 sm:p-4 shadow-xl z-20 flex items-center gap-2.5">
              {/* Quantity Controls */}
              <div className="flex items-center space-x-2 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-center font-black text-xs text-slate-900 font-mono w-4">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(q => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white text-[#d70f64] font-bold flex items-center justify-center hover:bg-pink-50 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Submit Button */}
              <button
                type="button"
                onClick={handleConfirmAddToCartFromModal}
                className="flex-1 py-3 px-4 bg-[#e21b70] hover:bg-[#c2135d] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition shadow-md shadow-pink-500/20 cursor-pointer active:scale-[0.98]"
              >
                <span>Add to cart</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-extrabold text-sm">
                    Tk {calculatedModalTotal}
                  </span>
                  {calculatedModalRegularTotal > calculatedModalTotal && (
                    <span className="text-xs line-through opacity-75 font-normal">
                      Tk {calculatedModalRegularTotal}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        BOTTOM SHEET POPUP: IF PRODUCT IS NOT AVAILABLE
        ========================================================================
      */}
      {isUnavailPopupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200" onClick={() => setIsUnavailPopupOpen(false)}>
          <div 
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-6 animate-in slide-in-from-bottom duration-300 pb-8 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull indicator bar */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto -mt-2 mb-2" />

            <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight">
              If this product is not available
            </h3>

            {/* Options List */}
            <div className="space-y-4">
              {/* Option 1: Call me */}
              <label 
                onClick={() => setUnavailPreference('call')}
                className="flex items-center space-x-3.5 p-3 rounded-2xl cursor-pointer hover:bg-slate-50 transition"
              >
                <div>
                  {unavailPreference === 'call' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#d70f64] bg-[#d70f64] flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white shrink-0" />
                  )}
                </div>
                <span className="text-sm font-extrabold text-slate-800">
                  Call me
                </span>
              </label>

              {/* Option 2: Remove it from my order */}
              <label 
                onClick={() => setUnavailPreference('remove')}
                className="flex items-center space-x-3.5 p-3 rounded-2xl cursor-pointer hover:bg-slate-50 transition"
              >
                <div>
                  {unavailPreference === 'remove' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#d70f64] bg-[#d70f64] flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white shrink-0" />
                  )}
                </div>
                <span className="text-sm font-extrabold text-slate-800">
                  Remove it from my order
                </span>
              </label>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={() => setIsUnavailPopupOpen(false)}
              className="w-full py-4 bg-[#d70f64] hover:bg-[#b00c50] text-white rounded-2xl font-black text-sm flex items-center justify-center cursor-pointer shadow-lg shadow-pink-500/10 active:scale-[0.98] transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* CUSTOMER LOGIN / REGISTER POPUP MODAL */}
      {isCustomerLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4 relative">
            <div className="absolute top-3.5 right-3.5 flex items-center space-x-2 z-10">
              <button 
                onClick={() => setIsCustomerLoginModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Customer Login / Register</h3>
                <p className="text-xs text-slate-500">Enter Name, Phone & Password</p>
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const nameInput = (e.currentTarget.elements.namedItem('loginName') as HTMLInputElement)?.value || '';
                const phoneInput = (e.currentTarget.elements.namedItem('loginPhone') as HTMLInputElement)?.value || '';
                const passInput = (e.currentTarget.elements.namedItem('loginPass') as HTMLInputElement)?.value || '';

                if (!phoneInput || !passInput) {
                  alert('Please enter phone number and password.');
                  return;
                }

                // Try login first
                const res = loginUser('customer', phoneInput, passInput);
                if (res.success) {
                  alert('✅ Login successful!');
                  setIsCustomerLoginModalOpen(false);
                  return;
                }

                // If not registered, redirect to OTP SMS Verification flow
                alert('Account not found with this password. Opening OTP verification to complete signup.');
                setIsCustomerLoginModalOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="space-y-3 pt-2 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input 
                  name="loginName"
                  type="text" 
                  placeholder="e.g. Rahim Ahmed"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 shadow-2xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                <input 
                  name="loginPhone"
                  type="text" 
                  required
                  placeholder="e.g. 01811223344"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 shadow-2xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Password *</label>
                <input 
                  name="loginPass"
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 shadow-2xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer active:scale-95"
              >
                Log in / Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        CUSTOMER PERMISSION WINDOW (POPUP MODAL)
        User requirement:
        "vendor order accept korar shomoy order er upor ekTa time level thakbe sheTa set kore accept korbe.
        tokon customer er kace ekTa permission window show hobe..jeTate bola hobe vendor er food ready hote eto minit lagbe apni ki order continue korte chan ki na..customer ok ba no select korte pare.ok bolle.order puropuri place hoye jabe.vendor order ready korbe"
        ========================================================================
      */}
      {myOrders.filter(o => o.status === 'vendor_accepted' && !o.customer_confirmed_prep).map((prepOrder) => (
        <div key={prepOrder.id} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                Order #{prepOrder.order_code}
              </span>
              <h3 className="text-lg font-black text-slate-900 pt-1">
                Estimated Cooking Time
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">{prepOrder.vendor?.name || 'Restaurant'}</span> estimates that preparing your meal will take <span className="font-black text-amber-600 text-sm">{prepOrder.vendor_prep_minutes || 15} minutes</span>.
              </p>
              <p className="text-xs font-bold text-slate-800 pt-1">
                Do you want to continue with this order?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => customerRespondToPrepTime(prepOrder.id, false)}
                className="py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer border border-slate-200"
              >
                <X className="w-4 h-4" />
                <span>No (Cancel)</span>
              </button>

              <button
                onClick={() => customerRespondToPrepTime(prepOrder.id, true)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>OK (Continue)</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Choose Area Modal (Division -> City/Area Selection) */}
      {isChooseAreaModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Choose Your Area</h3>
                  <p className="text-xs font-semibold text-slate-500">আপনার শহর বা এলাকা নির্বাচন করুন</p>
                </div>
              </div>
              <button
                onClick={() => setIsChooseAreaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Option 1: All Areas */}
              <button
                onClick={() => {
                  setSelectedArea('all');
                  setIsChooseAreaModalOpen(false);
                }}
                className={`w-full p-4 rounded-2xl border-2 text-left font-black text-sm transition flex items-center justify-between cursor-pointer ${
                  !selectedArea || selectedArea.toLowerCase() === 'all'
                    ? 'border-orange-500 bg-orange-50/60 text-orange-600 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Store className="w-5 h-5 text-orange-600" />
                  <div>
                    <span>সকল এলাকা (All Areas)</span>
                    <p className="text-xs font-medium text-slate-500">Show restaurants & shops from all locations</p>
                  </div>
                </div>
                {(!selectedArea || selectedArea.toLowerCase() === 'all') && (
                  <Check className="w-5 h-5 text-orange-600 stroke-[3]" />
                )}
              </button>

              {/* Option 2: Grouped by Division */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Select by Division & City (বিভাগ ও শহর)
                </h4>

                {divisions.map((div) => {
                  const divAreas = cityAreas.filter(a => a.division_id === div.id);
                  return (
                    <div key={div.id} className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/70 space-y-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          {div.name}
                        </h5>
                      </div>

                      {divAreas.length === 0 ? (
                        <p className="text-xs text-slate-400 italic pl-4">No areas added yet in this division</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {divAreas.map((area) => {
                            const isSelected = selectedArea?.toLowerCase() === area.name.toLowerCase();
                            return (
                              <button
                                key={area.id}
                                onClick={() => {
                                  setSelectedArea(area.name);
                                  setIsChooseAreaModalOpen(false);
                                }}
                                className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-orange-600 text-white shadow-xs'
                                    : 'bg-white text-slate-800 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
                                }`}
                              >
                                <span className="truncate">{area.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          targetRole="customer"
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* 
        ========================================================================
        11. BOTTOM FLOATING NAVIGATION DOCK (100% Matching Screenshot_20260930_184203.jpg)
        Food, Grocery, Search, Carts, Account
        ========================================================================
      */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1 px-4 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* 1. Food (Active in Orange) */}
          <button
            onClick={() => setActiveBottomNav('food')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeBottomNav === 'food' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'food' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Food</span>
          </button>

          {/* 2. Grocery */}
          <button
            onClick={() => {
              setActiveBottomNav('grocery');
              setSearchQuery('Grocery');
            }}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeBottomNav === 'grocery' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'grocery' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Grocery</span>
          </button>

          {/* 3. Carts (Middle Tab) */}
          <button
            onClick={() => setActiveBottomNav('carts')}
            className={`relative flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeBottomNav === 'carts' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`relative p-1 rounded-xl ${activeBottomNav === 'carts' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Carts</span>
          </button>

          {/* 4. Orders (Replaced Carts) */}
          <button
            onClick={() => {
              setAccountSubView('none');
              setActiveBottomNav('orders');
            }}
            className={`relative flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeBottomNav === 'orders' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'orders' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Orders</span>
          </button>

          {/* 5. Account */}
          <button
            onClick={() => setActiveBottomNav('account')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeBottomNav === 'account' ? 'text-orange-600 font-black' : 'text-slate-500 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl ${activeBottomNav === 'account' ? 'bg-orange-50 text-orange-600' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
