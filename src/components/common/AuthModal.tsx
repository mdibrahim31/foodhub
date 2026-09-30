import React, { useState } from 'react';
import { useDelivery } from '../../context/DeliveryContext';
import { PortalRole } from '../../types/database';
import { 
  User, 
  Lock, 
  Phone, 
  Store, 
  Bike, 
  ShieldCheck, 
  KeyRound, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  LogOut,
  Sparkles
} from 'lucide-react';

interface AuthModalProps {
  targetRole: PortalRole;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  targetRole,
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    currentUser,
    loginUser,
    setPasswordForUser,
    registerCustomer,
    logoutUser,
    vendors,
    riders
  } = useDelivery();

  const [mode, setMode] = useState<'login' | 'register' | 'set_password'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!phone.trim()) {
      setErrorMessage('Please enter your registered phone number');
      return;
    }

    const res = loginUser(targetRole, phone.trim(), password.trim());
    if (res.requiresPasswordSetup) {
      setMode('set_password');
      setSuccessMessage('First-time login detected! Please set a new secure password.');
      return;
    }

    if (!res.success) {
      setErrorMessage(res.message || 'Login failed. Please check your credentials.');
      return;
    }

    setSuccessMessage('Logged in successfully!');
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 600);
  };

  const handleSetFirstTimePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || newPassword.length < 3) {
      setErrorMessage('Password must be at least 3 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const success = setPasswordForUser(targetRole, phone.trim(), newPassword);
    if (!success) {
      setErrorMessage('Failed to set password. Please ensure this phone was registered by Admin.');
      return;
    }

    setSuccessMessage('Password saved & logged in successfully!');
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 600);
  };

  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage('Name, Phone, and Password are required');
      return;
    }

    const res = registerCustomer({
      name: name.trim(),
      phone: phone.trim(),
      password: password.trim(),
      email: email.trim()
    });

    if (!res.success) {
      setErrorMessage(res.message || 'Registration failed');
      return;
    }

    setSuccessMessage('Registered & logged in successfully!');
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 600);
  };

  const roleTitle = targetRole === 'vendor' 
    ? 'Restaurant Partner Login'
    : targetRole === 'rider'
    ? 'Rider Hero Login'
    : targetRole === 'admin'
    ? 'Admin Secure Login'
    : 'Customer Account';

  const roleIcon = targetRole === 'vendor' 
    ? <Store className="w-6 h-6 text-orange-500" />
    : targetRole === 'rider'
    ? <Bike className="w-6 h-6 text-pink-500" />
    : targetRole === 'admin'
    ? <ShieldCheck className="w-6 h-6 text-indigo-500" />
    : <User className="w-6 h-6 text-rose-500" />;

  // Quick Account Switcher Helper
  const registeredVendors = vendors.map(v => ({ name: v.name, phone: v.phone, is_set: v.is_password_set }));
  const registeredRiders = riders.map(r => ({ name: r.name, phone: r.phone, is_set: r.is_password_set }));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-5 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
              {roleIcon}
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">{roleTitle}</h3>
              <p className="text-xs text-slate-500">
                {targetRole === 'customer' 
                  ? 'Sign in or create account to place orders'
                  : 'Enter your Admin-registered phone to log in'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Logged In state */}
        {currentUser && currentUser.role === targetRole && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Logged in as {currentUser.name}</span>
              </div>
              <p className="text-emerald-700 mt-0.5">{currentUser.phone} • {currentUser.zone || 'Verified'}</p>
            </div>
            <button
              onClick={() => {
                logoutUser();
                setSuccessMessage('Logged out');
              }}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-medium">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                {targetRole === 'admin' ? 'Admin Username / Phone' : 'Registered Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={targetRole === 'vendor' ? '01711122233' : targetRole === 'rider' ? '01755500011' : '01882208531'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password (e.g. 123)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              <span>Log In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Pre-fill helpers */}
            {targetRole === 'vendor' && registeredVendors.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Quick Select Registered Vendor:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {registeredVendors.slice(0, 3).map((v) => (
                    <button
                      key={v.phone}
                      type="button"
                      onClick={() => {
                        setPhone(v.phone);
                        setPassword('123');
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 rounded-lg text-[11px] font-semibold text-slate-700 border border-slate-200"
                    >
                      {v.name} ({v.phone})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {targetRole === 'rider' && registeredRiders.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  Quick Select Registered Rider:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {registeredRiders.slice(0, 3).map((r) => (
                    <button
                      key={r.phone}
                      type="button"
                      onClick={() => {
                        setPhone(r.phone);
                        setPassword('123');
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-pink-50 hover:text-pink-700 rounded-lg text-[11px] font-semibold text-slate-700 border border-slate-200"
                    >
                      {r.name} ({r.phone})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Switch to Register for Customer */}
            {targetRole === 'customer' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-rose-600 font-bold hover:underline"
                >
                  Don't have an account? Register New Customer
                </button>
              </div>
            )}
          </form>
        )}

        {/* MODE 2: FIRST TIME PASSWORD SETUP */}
        {mode === 'set_password' && (
          <form onSubmit={handleSetFirstTimePassword} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">Set Password for Phone: {phone}</p>
                <p className="text-[11px]">Since this is your first login, choose your secret password.</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Create New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Password & Log In</span>
            </button>
          </form>
        )}

        {/* MODE 3: CUSTOMER REGISTRATION */}
        {mode === 'register' && (
          <form onSubmit={handleCustomerRegister} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Your Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Mobile Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01882208531"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tanvir@gmail.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-rose-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Account & Log In</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-500 font-bold hover:underline"
              >
                Already registered? Back to Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
