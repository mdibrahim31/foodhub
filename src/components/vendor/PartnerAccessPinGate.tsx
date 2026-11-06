import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PartnerAccessPinGateProps {
  children: React.ReactNode;
}

export const PartnerAccessPinGate: React.FC<PartnerAccessPinGateProps> = ({ children }) => {
  // Read PIN from build / runtime environment variable (GitHub Secrets or Variables)
  const REQUIRED_PIN = (
    import.meta.env.VITE_PARTNER_ACCESS_PIN || 
    import.meta.env.VITE_PARTNER_PIN || 
    '123456'
  ).toString().trim();

  const [inputPin, setInputPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('foodiplace_partner_access_pin_verified') === 'true';
    }
    return false;
  });

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = inputPin.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter the Security Access PIN.');
      return;
    }

    if (cleanInput === REQUIRED_PIN) {
      setIsUnlocked(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('foodiplace_partner_access_pin_verified', 'true');
      }
    } else {
      setErrorMsg('Incorrect Access PIN. Permission denied.');
    }
  };

  const handleLockPanel = () => {
    setIsUnlocked(false);
    setInputPin('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('foodiplace_partner_access_pin_verified');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/20 space-y-6 text-slate-900 animate-in zoom-in-95 duration-200">
          
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500/30 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Partner Access Panel
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Protected Security Gate
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs text-emerald-900 font-bold">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Website access is restricted. Enter the authorized Security PIN to enter <span className="underline font-mono">partner_access_panel.html</span>.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-extrabold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PIN Input Form */}
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Security PIN Code
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="Enter Access PIN"
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl text-lg font-mono font-black tracking-widest text-slate-900 focus:outline-hidden transition shadow-2xs"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition p-0.5"
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Unlock Access Panel</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-400 font-bold border-t border-slate-100">
            <span>foodiplace Security System</span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating Lock Session Badge Bar */}
      <div className="sticky top-0 z-[9999] bg-slate-900 text-white text-[11px] font-bold px-4 py-1.5 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Partner Access Panel Authenticated</span>
        </div>
        <button
          onClick={handleLockPanel}
          className="px-2.5 py-0.5 bg-rose-600/80 hover:bg-rose-600 text-white font-black text-[10px] uppercase rounded-lg transition flex items-center space-x-1 cursor-pointer"
          title="Lock Session"
        >
          <Lock className="w-3 h-3" />
          <span>Lock Panel</span>
        </button>
      </div>

      {children}
    </div>
  );
};
