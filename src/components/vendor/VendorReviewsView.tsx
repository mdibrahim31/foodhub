import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  X, 
  ChevronRight, 
  Star, 
  Calendar, 
  Filter, 
  CornerDownRight, 
  Check, 
  ShoppingBag, 
  ChevronDown, 
  ChevronLeft, 
  MessageSquare, 
  AlertCircle, 
  Clock, 
  User, 
  MapPin, 
  Send,
  Edit2
} from 'lucide-react';
import { Vendor, VendorReview, Order } from '../../types/database';

interface VendorReviewsViewProps {
  vendor: Vendor;
  orders: Order[];
  onClose: () => void;
  onOpenStoreSelector?: () => void;
}

const STORAGE_KEY_PREFIX = 'foodiplace_vendor_reviews_';

// Initial reviews are empty for newly registered vendors (loaded only from database)
const getInitialReviews = (_vendor: Vendor): VendorReview[] => {
  return [];
};

export const VendorReviewsView: React.FC<VendorReviewsViewProps> = ({
  vendor,
  orders,
  onClose,
  onOpenStoreSelector
}) => {
  // Load persistent reviews from localStorage
  const [reviews, setReviews] = useState<VendorReview[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${vendor.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse saved reviews:', e);
      }
    }
    return getInitialReviews(vendor);
  });

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${vendor.id}`, JSON.stringify(reviews));
      } catch (e) {
        console.warn('Failed to save reviews:', e);
      }
    }
  }, [reviews, vendor.id]);

  // Filters & Pagination State
  const [selectedPeriod, setSelectedPeriod] = useState<'Last 6 months' | 'Last 30 days' | 'Last 7 days' | 'All time'>('Last 6 months');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'needs_reply'>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [reviewsPerPage, setReviewsPerPage] = useState<number>(5);
  const [isPerPageDropdownOpen, setIsPerPageDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | {
    order_code: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    items: { item_name: string; quantity: number; item_price: number; subtotal: number }[];
    total: number;
    created_at: string;
  } | null>(null);

  const [disputeReviewTarget, setDisputeReviewTarget] = useState<VendorReview | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('False complaint / Quality mismatch');
  const [disputeComment, setDisputeComment] = useState<string>('');
  const [disputeSuccessToast, setDisputeSuccessToast] = useState<string | null>(null);

  // Inline reply editing
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Helper date formatter matching screenshot format: 06/14/2026 • 01:06 PM • lwtl-2624-cvxx
  const formatReviewHeaderDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // hour '0' should be '12'
      const hh = String(hours).padStart(2, '0');
      return `${mm}/${dd}/${yyyy} • ${hh}:${minutes} ${ampm}`;
    } catch {
      return '06/14/2026 • 01:06 PM';
    }
  };

  // Helper date formatter for Reply: 06/15/2026, 11:31 AM
  const formatReplyDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'AM' : 'PM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hh = String(hours).padStart(2, '0');
      return `${mm}/${dd}/${yyyy}, ${hh}:${minutes} ${ampm}`;
    } catch {
      return '06/15/2026, 11:31 AM';
    }
  };

  // Distribution calculations
  const totalReviews = reviews.length;
  
  // Calculate star breakdown (5 down to 1)
  const starDistribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    });

    return [5, 4, 3, 2, 1].map(stars => {
      const count = counts[stars] || 0;
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      return { stars, count, percentage };
    });
  }, [reviews, totalReviews]);

  // Average Rating
  const storeRatingDisplay = useMemo(() => {
    if (totalReviews === 0) return '0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / totalReviews).toFixed(1);
  }, [reviews, totalReviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      // Rating filter
      if (ratingFilter !== 'all') {
        if (ratingFilter === 'needs_reply') {
          if (rev.vendor_reply?.text) return false;
        } else {
          const targetStar = parseInt(ratingFilter, 10);
          if (Math.round(rev.rating) !== targetStar) return false;
        }
      }

      // Period filter
      if (selectedPeriod === 'Last 7 days') {
        const diffDays = (Date.now() - new Date(rev.created_at).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (selectedPeriod === 'Last 30 days') {
        const diffDays = (Date.now() - new Date(rev.created_at).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      } else if (selectedPeriod === 'Last 6 months') {
        const diffDays = (Date.now() - new Date(rev.created_at).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 185) return false;
      }

      return true;
    });
  }, [reviews, ratingFilter, selectedPeriod]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / reviewsPerPage));
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * reviewsPerPage;
    return filteredReviews.slice(startIndex, startIndex + reviewsPerPage);
  }, [filteredReviews, currentPage, reviewsPerPage]);

  // Reset pagination if filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [ratingFilter, selectedPeriod, reviewsPerPage]);

  // Action: Open Order Details
  const handleViewOrder = (review: VendorReview) => {
    // Try to find matching real order
    const realOrder = orders.find(o => 
      o.order_code.toLowerCase() === review.order_code.toLowerCase() ||
      o.id === review.order_id
    );

    if (realOrder) {
      setSelectedOrderDetails(realOrder);
    } else {
      setSelectedOrderDetails({
        order_code: review.order_code,
        customer_name: review.customer_name || 'Customer',
        customer_phone: review.customer_phone || '',
        delivery_address: 'Standard customer delivery address',
        items: [],
        total: 0,
        created_at: review.created_at
      });
    }
  };

  // Action: Save Reply
  const handleSaveReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);

    setTimeout(() => {
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            vendor_reply: {
              text: replyText.trim(),
              replied_at: new Date().toISOString(),
              status: 'approved'
            }
          };
        }
        return r;
      }));
      setReplyingReviewId(null);
      setReplyText('');
      setIsSubmittingReply(false);
    }, 200);
  };

  // Action: Submit Dispute
  const handleSubmitDispute = () => {
    if (!disputeReviewTarget) return;

    setReviews(prev => prev.map(r => {
      if (r.id === disputeReviewTarget.id) {
        return {
          ...r,
          dispute: {
            reason: disputeReason,
            comment: disputeComment.trim(),
            status: 'submitted',
            disputed_at: new Date().toISOString()
          }
        };
      }
      return r;
    }));

    setDisputeSuccessToast(`Dispute submitted for #${disputeReviewTarget.order_code}. Support team will investigate.`);
    setDisputeReviewTarget(null);
    setDisputeComment('');

    setTimeout(() => {
      setDisputeSuccessToast(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 pb-20 select-none font-sans">
      {/* 
        ========================================================================
        TOP BAR: Back Arrow + Store Pill + Red Cross Close Button
        (100% Matching Screenshot 1)
        ========================================================================
      */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-slate-100 shadow-2xs">
        {/* Left: Back Arrow */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-800 hover:bg-slate-50 transition cursor-pointer shrink-0"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Store Pill */}
        <button
          onClick={onOpenStoreSelector}
          className="flex-1 mx-2.5 max-w-[260px] sm:max-w-xs flex items-center space-x-2 px-3.5 py-2 rounded-full border border-slate-300 bg-white shadow-2xs text-slate-900 hover:border-slate-400 transition text-left cursor-pointer"
        >
          <Building2 className="w-4 h-4 text-slate-800 shrink-0 stroke-[2]" />
          <span className="font-bold text-xs sm:text-sm truncate">
            {vendor.name} {vendor.unique_id ? `(${vendor.unique_id})` : '(LWTL)'}
          </span>
        </button>

        {/* Right: Red Cross Close Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-[#e21b70] hover:bg-rose-50 transition cursor-pointer shrink-0"
          title="Close Reviews"
          aria-label="Close"
        >
          <div className="w-5 h-5 rounded-full border-2 border-[#e21b70] flex items-center justify-center text-[#e21b70]">
            <X className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </button>
      </div>

      <div className="max-w-md mx-auto pt-4">
        {/* Toast Notification */}
        {disputeSuccessToast && (
          <div className="mx-4 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2.5 text-xs font-bold text-emerald-800 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
            <span>{disputeSuccessToast}</span>
          </div>
        )}

        {/* 
          ========================================================================
          PAGE TITLE
          "Reviews" (Matching Screenshot 1)
          ========================================================================
        */}
        <div className="px-4 mb-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reviews
          </h1>
        </div>

        {/* 
          ========================================================================
          STORE RATING CARD (100% Matching Screenshot 1)
          ========================================================================
        */}
        <div className="mx-4 mb-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between text-slate-900">
            <span className="font-extrabold text-base tracking-tight">Store rating</span>
            <ChevronRight className="w-5 h-5 text-slate-700 stroke-[2.5]" />
          </div>

          {/* Large Star & Rating */}
          <div className="flex items-center space-x-2.5">
            <Star className="w-7 h-7 fill-[#d70f64] text-[#d70f64]" />
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {storeRatingDisplay}
            </span>
          </div>

          {/* Review Count */}
          <div>
            <p className="text-sm font-bold text-slate-900">
              {totalReviews} reviews
            </p>
          </div>

          {/* Star Distribution Breakdown (5 stars down to 1 star) */}
          <div className="space-y-2 pt-1">
            {starDistribution.map(({ stars, count, percentage }) => (
              <div 
                key={stars} 
                onClick={() => setRatingFilter(prev => prev === String(stars) ? 'all' : String(stars) as any)}
                className="flex items-center space-x-3 text-xs cursor-pointer group hover:opacity-90"
              >
                <span className="w-12 font-medium text-slate-800 shrink-0">
                  {stars} stars
                </span>

                {/* Progress bar track */}
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#d70f64] rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Count & Percentage label */}
                <span className="w-20 text-right font-medium text-slate-800 shrink-0">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 
          ========================================================================
          FILTER & PERIOD BAR (100% Matching Screenshot 1 & 2)
          - Left: Pink outline pill button [📅 Last 6 months]
          - Right: Circular Filter icon button
          ========================================================================
        */}
        <div className="px-4 mb-4 flex items-center space-x-3 relative">
          {/* Period Pill Button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                setIsFilterMenuOpen(false);
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-full border-2 border-[#d70f64] text-[#d70f64] bg-white font-bold text-sm shadow-2xs hover:bg-pink-50/40 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 stroke-[2.2]" />
              <span>{selectedPeriod}</span>
            </button>

            {/* Period Dropdown Popover */}
            {isPeriodDropdownOpen && (
              <div className="absolute top-12 left-0 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-xs font-bold text-slate-800">
                {(['Last 7 days', 'Last 30 days', 'Last 6 months', 'All time'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-pink-50/50 ${
                      selectedPeriod === period ? 'text-[#d70f64] font-black' : ''
                    }`}
                  >
                    <span>{period}</span>
                    {selectedPeriod === period && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Funnel / Filter Button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsFilterMenuOpen(!isFilterMenuOpen);
                setIsPeriodDropdownOpen(false);
              }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition cursor-pointer shadow-2xs ${
                ratingFilter !== 'all' 
                  ? 'border-[#d70f64] text-[#d70f64] bg-pink-50' 
                  : 'border-slate-300 text-slate-800 bg-white hover:bg-slate-50'
              }`}
              title="Filter Reviews"
              aria-label="Filter"
            >
              <Filter className="w-4 h-4 stroke-[2]" />
            </button>

            {/* Rating Filter Dropdown Popover */}
            {isFilterMenuOpen && (
              <div className="absolute top-12 left-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 text-xs font-bold text-slate-800">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  Filter by Rating
                </div>
                {[
                  { label: 'All Reviews', value: 'all' },
                  { label: '5 Stars only', value: '5' },
                  { label: '4 Stars only', value: '4' },
                  { label: '3 Stars only', value: '3' },
                  { label: '2 Stars only', value: '2' },
                  { label: '1 Star only', value: '1' },
                  { label: 'Needs Reply', value: 'needs_reply' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      setRatingFilter(item.value as any);
                      setIsFilterMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-pink-50/50 ${
                      ratingFilter === item.value ? 'text-[#d70f64] font-black' : ''
                    }`}
                  >
                    <span>{item.label}</span>
                    {ratingFilter === item.value && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {ratingFilter !== 'all' && (
            <button
              onClick={() => setRatingFilter('all')}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* 
          ========================================================================
          REVIEWS LIST (100% Matching Screenshot 2)
          ========================================================================
        */}
        <div className="space-y-4">
          {paginatedReviews.length === 0 ? (
            <div className="mx-4 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
              <Star className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-800">No reviews found for this filter</p>
              <p className="text-xs text-slate-400">Try changing your date filter or star selection.</p>
            </div>
          ) : (
            paginatedReviews.map((review) => (
              <div
                key={review.id}
                className="mx-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden"
              >
                {/* 
                  Card Top Row: 
                  Left: 5 Star rating icons (4 filled pink + 1 grey)
                  Right: Date • Time • Order code
                  (e.g. 06/14/2026 • 01:06 PM • lwtl-2624-cvxx)
                */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
                  {/* Star Icons */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-4 h-4 ${
                          starIdx <= Math.round(review.rating)
                            ? 'fill-[#d70f64] text-[#d70f64]'
                            : 'fill-slate-200 text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Date, Time & Order Code */}
                  <div className="text-right text-[11px] sm:text-xs text-slate-500 font-medium tracking-tight truncate pl-2">
                    {formatReviewHeaderDate(review.created_at)} • {review.order_code}
                  </div>
                </div>

                {/* Review Text Comment (e.g. "very poor qty") */}
                <div className="px-4 py-3.5 text-sm font-semibold text-slate-900 border-b border-slate-100 leading-snug">
                  {review.comment}
                </div>

                {/* 
                  VENDOR REPLY SECTION (Matching Screenshot 2):
                  - ↳ Your Reply (bold) + Timestamp on right
                  - Reply text
                  - [✓ Approved] badge
                */}
                {review.vendor_reply?.text ? (
                  <div className="px-4 py-3.5 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                        <CornerDownRight className="w-4 h-4 text-slate-800 stroke-[2.5]" />
                        <span>Your Reply</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatReplyDate(review.vendor_reply.replied_at)}
                        </span>
                        <button
                          onClick={() => {
                            setReplyingReviewId(review.id);
                            setReplyText(review.vendor_reply?.text || '');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 transition"
                          title="Edit Reply"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Reply Text Body */}
                    <p className="text-xs sm:text-[13px] text-slate-800 font-medium leading-relaxed pl-5">
                      {review.vendor_reply.text}
                    </p>

                    {/* Status badge: ✓ Approved */}
                    <div className="pl-5 pt-1">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-800 text-[11px] font-bold shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
                        <span>Approved</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Option to compose a reply if not replied yet */
                  <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100">
                    {replyingReviewId === review.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1.5 text-xs font-black text-slate-900">
                          <CornerDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Write Your Reply:</span>
                        </div>
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Reply to the customer with courtesy and clarity..."
                          className="w-full text-xs p-3 border border-slate-200 rounded-2xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#d70f64] font-medium"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setReplyingReviewId(null);
                              setReplyText('');
                            }}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveReply(review.id)}
                            disabled={isSubmittingReply || !replyText.trim()}
                            className="px-4 py-1.5 bg-[#d70f64] text-white rounded-xl text-xs font-black shadow-xs hover:bg-[#be0d58] transition disabled:opacity-50 flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Post Reply</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingReviewId(review.id);
                          setReplyText('');
                        }}
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#d70f64] hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply to this review</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Dispute status indicator if active */}
                {review.dispute && (
                  <div className="px-4 py-2 bg-amber-50 border-t border-amber-200/70 flex items-center justify-between text-[11px] font-bold text-amber-900">
                    <span className="flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Disputed: {review.dispute.reason}</span>
                    </span>
                    <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 bg-amber-200/80 rounded-md">
                      {review.dispute.status}
                    </span>
                  </div>
                )}

                {/* 
                  CARD FOOTER ACTIONS (Matching Screenshot 2):
                  - Left: [🛍 View order] (Pink outline button)
                  - Right: Dispute (Pink text button)
                */}
                <div className="px-4 py-3.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleViewOrder(review)}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-[#d70f64] text-[#d70f64] hover:bg-pink-50/50 transition text-xs font-black cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                    <span>View order</span>
                  </button>

                  <button
                    onClick={() => {
                      setDisputeReviewTarget(review);
                      setDisputeReason('False complaint / Quality mismatch');
                      setDisputeComment('');
                    }}
                    className="text-xs font-black text-[#d70f64] hover:underline cursor-pointer transition active:scale-95"
                  >
                    Dispute
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 
          ========================================================================
          PAGINATION SECTION (100% Matching Screenshot 2)
          - Reviews per page: [ 5 ˅ ]
          - < (Previous)
          - > (Next)
          ========================================================================
        */}
        <div className="px-4 pt-4 pb-12 flex items-center justify-end space-x-3 text-xs text-slate-700 font-medium">
          <span>Reviews per page</span>

          {/* Per Page Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPerPageDropdownOpen(!isPerPageDropdownOpen)}
              className="px-3 py-1.5 rounded-full border border-slate-300 bg-white flex items-center space-x-1 text-xs font-bold text-slate-800 hover:border-slate-400 shadow-2xs cursor-pointer"
            >
              <span>{reviewsPerPage}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isPerPageDropdownOpen && (
              <div className="absolute bottom-10 right-0 w-20 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-40 text-xs font-bold text-slate-800">
                {[5, 10, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setReviewsPerPage(num);
                      setIsPerPageDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-center hover:bg-pink-50/50 ${
                      reviewsPerPage === num ? 'text-[#d70f64] font-black' : ''
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Previous Page Button */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next Page Button */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 
        ========================================================================
        MODAL: ORDER DETAILS (Triggered by [🛍 View order])
        ========================================================================
      */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-[#d70f64]" />
                <h3 className="font-black text-slate-900 text-base">
                  Order Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Code & Time */}
            <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Order Code:</span>
                <span className="font-mono font-black text-sm text-[#d70f64]">
                  #{selectedOrderDetails.order_code}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Date:</span>
                <span>{new Date(selectedOrderDetails.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center space-x-2 text-slate-800 font-bold">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{selectedOrderDetails.customer_name} ({selectedOrderDetails.customer_phone})</span>
              </div>
              <div className="flex items-start space-x-2 text-slate-600 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{selectedOrderDetails.delivery_address}</span>
              </div>
            </div>

            {/* Food Items List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase text-slate-400">Order Items</h4>
              {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                selectedOrderDetails.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-800">
                      {it.quantity}x {it.item_name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ৳{it.subtotal || it.item_price * it.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Order items for {vendor.name}</p>
              )}
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-black text-sm">
              <span className="text-slate-800">Total Bill:</span>
              <span className="font-mono text-[#d70f64] text-base">
                ৳{(selectedOrderDetails as any).total || (selectedOrderDetails as any).total_cash_payable || 0}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: DISPUTE REVIEW (Triggered by Dispute button)
        ========================================================================
      */}
      {disputeReviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-[#d70f64]" />
                <h3 className="font-black text-slate-900 text-base">
                  Dispute Review
                </h3>
              </div>
              <button
                onClick={() => setDisputeReviewTarget(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Disputing review for Order <span className="font-mono font-bold text-slate-900">#{disputeReviewTarget.order_code}</span>. FoodHub partner safety team will review the kitchen prep records and rider delivery history.
            </p>

            {/* Dispute Reason Selection */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-800">Reason for Dispute *</label>
              {[
                'False complaint / Quality mismatch',
                'Rider mishandled food delivery',
                'Wrong order delivered by mistake',
                'Abusive or misleading review',
                'Other reason'
              ].map((reason) => (
                <label 
                  key={reason} 
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                    disputeReason === reason 
                      ? 'border-[#d70f64] bg-pink-50/40 text-slate-900 font-bold' 
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="disputeReason"
                    checked={disputeReason === reason}
                    onChange={() => setDisputeReason(reason)}
                    className="accent-[#d70f64]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {/* Dispute Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Additional Kitchen Note (Optional)
              </label>
              <textarea
                rows={2}
                value={disputeComment}
                onChange={(e) => setDisputeComment(e.target.value)}
                placeholder="Explain what happened during food packaging..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#d70f64]"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDisputeReviewTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDispute}
                className="px-5 py-2 bg-[#d70f64] hover:bg-[#be0d58] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition active:scale-95"
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
