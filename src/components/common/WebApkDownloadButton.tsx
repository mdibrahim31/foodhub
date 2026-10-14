import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  X, 
  Share2, 
  HelpCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Bike,
  Store,
  ChefHat,
  User,
  Sparkles
} from 'lucide-react';
import { useWebApkInstall } from './useWebApkInstall';

export interface WebApkDownloadButtonProps {
  appName: string;
  portalType: 'rider' | 'vendor' | 'admin' | 'subadmin' | 'customer' | 'orders';
  className?: string;
  apkDownloadUrl?: string;
  buttonTitle?: string;
}

export const WebApkDownloadButton: React.FC<WebApkDownloadButtonProps> = ({
  appName,
  portalType,
  className = 'absolute top-4 right-4 z-20',
  apkDownloadUrl,
  buttonTitle
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = useWebApkInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [copied, setCopied] = useState(false);

  const getPortalIcon = () => {
    switch (portalType) {
      case 'rider':
        return <Bike className="w-6 h-6 text-white" />;
      case 'vendor':
        return <Store className="w-6 h-6 text-white" />;
      case 'admin':
      case 'subadmin':
        return <ShieldCheck className="w-6 h-6 text-white" />;
      case 'orders':
        return <ChefHat className="w-6 h-6 text-white" />;
      case 'customer':
      default:
        return <User className="w-6 h-6 text-white" />;
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If install prompt is ready in browser, trigger 1-click WebAPK prompt immediately!
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const result = await install();
        if (result === 'accepted') {
          return;
        }
        if (result === 'unsupported') {
          setIsModalOpen(true);
        }
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If browser hasn't fired beforeinstallprompt or user is on iOS / desktop, open guidance modal
      setIsModalOpen(true);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      {/* Circular Download Button matching the user's screenshot */}
      <div className={className}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isInstalling}
          className={`w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-orange-500/30 flex items-center justify-center transition active:scale-95 border border-amber-300/60 cursor-pointer ${
            isInstalling ? 'opacity-70 animate-pulse' : ''
          }`}
          title={buttonTitle || `Install ${appName} WebAPK`}
          aria-label={`Install ${appName} WebAPK / App`}
        >
          <Download className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* WebAPK Installation Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] text-slate-900"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 sm:p-6 text-white relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 rounded-full transition text-white cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xs border border-white/30 shadow-inner shrink-0">
                  {getPortalIcon()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full text-white">
                      Android WebAPK & App
                    </span>
                    <span className="text-[10px] font-bold text-amber-100 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>Instant PWA</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">{appName}</h3>
                </div>
              </div>
              <p className="text-xs text-amber-50 leading-relaxed font-medium">
                ব্রাউজার ছাড়াই ফোনের হোমস্ক্রিনে অ্যাপ আইকন তৈরি করে ফুল-স্ক্রিনে নেটিভ অ্যাপের মতো ব্যবহার করুন।
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs font-medium">
              {isInstalled ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <p className="text-sm font-black text-emerald-800">
                    অ্যাপটি ইতিমধ্যে আপনার ডিভাইসে ইনস্টল করা আছে!
                  </p>
                  <p className="text-xs text-emerald-700">
                    আপনার ফোনের হোমস্ক্রিন অথবা অ্যাপ ড্রয়ার থেকে সরাসরি চালু করতে পারবেন।
                  </p>
                </div>
              ) : isInstallable ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
                    <Smartphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <h4 className="font-black text-amber-900 text-sm mb-0.5">
                        সরাসরি ফোনে ইনস্টল করুন (WebAPK)
                      </h4>
                      <p className="text-amber-800 leading-relaxed">
                        নিচের বাটনে ট্যাপ করলেই অ্যান্ড্রয়েডে সাথে সাথে WebAPK ইনস্টল উইন্ডো ওপেন হবে।
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsInstalling(true);
                      try {
                        const res = await install();
                        if (res === 'accepted') {
                          setIsModalOpen(false);
                        }
                      } finally {
                        setIsInstalling(false);
                      }
                    }}
                    disabled={isInstalling}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 transition cursor-pointer text-sm"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isInstalling ? 'ইনস্টল হচ্ছে...' : `${appName} ফোনে ইনস্টল করুন`}</span>
                  </button>
                </div>
              ) : isIOS ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="font-black text-slate-800 flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-amber-600" />
                    <span className="text-sm">iPhone / iPad এ ইনস্টল করার নিয়ম:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700 font-semibold leading-relaxed">
                    <li>Safari ব্রাউজারে এই পেজটি খুলুন।</li>
                    <li>নিচের মাঝখানে <strong className="text-slate-900 font-black">Share (শেয়ার)</strong> আইকনটিতে চাপুন।</li>
                    <li>স্ক্রোল করে <strong className="text-slate-900 font-black">"Add to Home Screen"</strong> চাপুন।</li>
                    <li>উপরে <strong className="text-slate-900 font-black">"Add"</strong> চাপলেই ফোনের হোমস্ক্রিনে অ্যাপ আইকন চলে আসবে!</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="font-black text-slate-800 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm">Android Chrome ব্রাউজারে WebAPK ইনস্টল করার ধাপ:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700 font-semibold leading-relaxed">
                    <li>Google Chrome ব্রাউজারের উপরে ডানে <strong className="text-slate-900 font-black">৩টি ডট (⋮)</strong> মেনু চাপুন।</li>
                    <li>মেনু থেকে <strong className="text-slate-900 font-black">"Install app"</strong> অথবা <strong className="text-slate-900 font-black">"Add to Home screen"</strong> অপশনটিতে চাপুন।</li>
                    <li><strong className="text-emerald-700 font-black">"Install"</strong> নিশ্চিত করলে সাথে সাথে ফোনে একটি ফুল-স্ক্রিন WebAPK অ্যাপ তৈরি হয়ে যাবে!</li>
                  </ol>
                </div>
              )}

              {/* Direct APK Download fallback if configured or for Rider */}
              {(apkDownloadUrl || portalType === 'rider') && (
                <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      সরাসরি APK ফাইল (.apk)
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Android Package</span>
                  </div>
                  <a
                    href={apkDownloadUrl || '/FoodHub-Rider.apk'}
                    download={apkDownloadUrl ? apkDownloadUrl.split('/').pop() : 'FoodHub-Rider.apk'}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-black text-white font-black rounded-xl text-center text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>সরাসরি .apk ফাইল ডাউনলোড করুন</span>
                  </a>
                </div>
              )}

              {/* Copy URL */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  ওয়েব লিংক (Web Link)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center space-x-1 transition cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700">ফুল-স্ক্রিন মোড</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700">দ্রুত লোডিং ও ক্যাশ</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700">হোমস্ক্রিন লোগো</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700">জিরো স্টোরেজ সাইজ</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">{appName} WebAPK</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black rounded-xl transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
