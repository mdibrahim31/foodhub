import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  Bike, 
  Globe, 
  ShieldCheck, 
  Share2, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useRiderPWAInstall } from './useRiderPWAInstall';

interface RiderAppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiderAppDownloadModal: React.FC<RiderAppDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = useRiderPWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'apk' | 'web'>('install');
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const riderWebUrl = `${currentOrigin}/rider.html`;
  const riderAppUrl = `${currentOrigin}/rider-app.html`;
  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(riderWebUrl)}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(riderWebUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await install();
      if (success) {
        onClose();
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 rounded-full transition text-white"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xs border border-white/30 shadow-inner">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                  Android & Web App
                </span>
                <span className="text-xs font-bold text-amber-100 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>2-in-1 Dual Setup</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-white">FoodHub Rider App</h2>
            </div>
          </div>
          <p className="text-xs text-amber-50 leading-relaxed">
            একই রিপোজিটরিতে রাইডার অ্যাপ ব্রাউজারেও চলবে (WebApp), আবার ফোনে ফুল অ্যাপ/APK হিসেবেও ডাউনলোড ও ইনস্টল করা যাবে।
          </p>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mt-4 bg-black/20 p-1 rounded-2xl backdrop-blur-xs">
            <button
              onClick={() => setActiveTab('install')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'install' 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-amber-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>১-ক্লিকে ইনস্টল</span>
            </button>
            <button
              onClick={() => setActiveTab('apk')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'apk' 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-amber-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>APK প্যাকেজ</span>
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'web' 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-amber-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>ওয়েব ব্রাউজার</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800">
          {/* TAB 1: 1-Click Mobile App Install (WebAPK) */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-amber-900 text-sm mb-0.5">
                    সরাসরি ফোনে ইনস্টল করুন (WebAPK App)
                  </h4>
                  <p className="text-amber-800 leading-relaxed">
                    Android ও Chrome ফোনে ব্রাউজার বার ছাড়া ফুল-স্ক্রিনে নেটিভ অ্যাপের মতো চলে। হোমস্ক্রিনে ফুডহাব রাইডার লোগো যুক্ত হবে এবং কোনো আননোন সোর্স পারমিশন লাগবে না।
                  </p>
                </div>
              </div>

              {isInstalled ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-800">
                    রাইডার অ্যাপ ইতিমধ্যে আপনার ডিভাইসে ইনস্টল করা আছে!
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    আপনি আপনার ফোনের হোমস্ক্রিন বা অ্যাপ ড্রয়ার থেকে এটি সরাসরি চালু করতে পারবেন।
                  </p>
                </div>
              ) : isInstallable ? (
                <div className="space-y-3">
                  <button
                    onClick={handleDirectInstall}
                    disabled={isInstalling}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-black rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isInstalling ? 'ইনস্টল হচ্ছে...' : 'মোবাইলে রাইডার অ্যাপ ইনস্টল করুন'}</span>
                  </button>
                  <p className="text-center text-xs text-slate-500">
                    ট্যাপ করলেই আপনার ফোনে "Add to Home screen / Install App" ডায়ালগ আসবে
                  </p>
                </div>
              ) : isIOS ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="font-bold text-slate-800 flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-amber-600" />
                    <span>iPhone / iOS ডিভাইসে ইনস্টল করার নিয়ম:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600">
                    <li>Safari ব্রাউজারে এই পেজটি খুলুন।</li>
                    <li>নিচের <strong className="text-slate-800">Share</strong> (শেয়ার) আইকনটি চাপুন।</li>
                    <li>মেনু স্ক্রোল করে <strong className="text-slate-800">"Add to Home Screen"</strong> (হোম স্ক্রিনে যোগ করুন) চাপুন।</li>
                    <li>উপরে <strong className="text-slate-800">"Add"</strong> চাপলে আপনার হোমস্ক্রিনে অ্যাপ আইকন চলে আসবে!</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="font-bold text-slate-800 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Android Chrome ব্রাউজারে ইনস্টল করার উপায়:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600">
                    <li>Google Chrome ব্রাউজারের উপরে ডানে <strong className="text-slate-800">৩টি ডট (⋮)</strong> মেনুতে ক্লিক করুন।</li>
                    <li><strong className="text-slate-800">"Install app"</strong> অথবা <strong className="text-slate-800">"Add to Home screen"</strong> অপশনটিতে চাপুন।</li>
                    <li>"Install" নিশ্চিত করলে সাথে সাথে ফোনে একটি আলাদা নেটিভ অ্যাপ হিসেবে ইনস্টল হয়ে যাবে!</li>
                  </ol>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">লাইভ জিপিএস ট্র্যাকিং</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">ফুল স্ক্রিন মোড</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">ইনস্ট্যান্ট রিলোড</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">ক্যাশ অন ডেলিভারি</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Standalone APK Generator / Package */}
          {activeTab === 'apk' && (
            <div className="space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-sm mb-0.5">
                    স্ট্যান্ডঅ্যালোন Android .apk প্যাকেজ
                  </h4>
                  <p className="text-blue-800 leading-relaxed">
                    এই রিপোজিটরির <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">manifest.rider.json</code> ও <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">twa-manifest.json</code> ফাইল তৈরি করা আছে। আপনি Microsoft PWABuilder অথবা Bubblewrap ব্যবহার করে ১-ক্লিকেই সাইন্ড বা আনসাইন্ড <strong className="text-blue-950 font-bold">.apk</strong> ফাইল ডাউনলোড করতে পারবেন।
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  ১-ক্লিকে APK ফাইল জেনারেট করার ধাপ:
                </h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>নিচের বাটনে ক্লিক করে <strong className="text-slate-800">PWABuilder</strong> ওপেন করুন।</li>
                  <li>আপনার রাইডার অ্যাপ URL ইতিমধ্যে সেট করা থাকবে।</li>
                  <li><strong className="text-slate-800">"Build My App"</strong> চেপে <strong className="text-slate-800">"Android APK"</strong> সিলেক্ট করুন।</li>
                  <li>সরাসরি <strong className="text-emerald-700 font-bold">.apk ফাইল ডাউনলোড</strong> করে যেকোনো ফোনে শেয়ার বা ইনস্টল করুন!</li>
                </ol>

                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>PWABuilder দিয়ে APK ডাউনলোড করুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 text-slate-600 space-y-1">
                <div className="text-[11px] font-bold text-slate-800">প্যাকেজ ডিটেইলস:</div>
                <div className="text-[11px] font-mono text-slate-700">Package ID: com.foodhub.rider</div>
                <div className="text-[11px] font-mono text-slate-700">App Name: FoodHub Rider</div>
                <div className="text-[11px] font-mono text-slate-700">Entry: rider-app.html & rider.html</div>
              </div>
            </div>
          )}

          {/* TAB 3: WebApp in Browser */}
          {activeTab === 'web' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-0.5">
                    ব্রাউজারে ওয়েবঅ্যাপ হিসেবে ব্যবহার (WebApp)
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    কোনো কিছু ইনস্টল না করেই যেকোনো কম্পিউটার, ল্যাপটপ বা মোবাইলের ব্রাউজার থেকে সরাসরি রাইডার পোর্টাল চালানো যাবে।
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  রাইডার ওয়েব লিংক (Web Link):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={riderWebUrl}
                    className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center space-x-1 transition cursor-pointer text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <a
                  href="/rider.html"
                  className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-center text-xs transition"
                >
                  rider.html ওপেন করুন
                </a>
                <a
                  href="/rider-app.html"
                  className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-center text-xs transition"
                >
                  rider-app.html ওপেন করুন
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>FoodHub Delivery v1.0.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
