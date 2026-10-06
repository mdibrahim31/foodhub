import React, { useState, useMemo } from 'react';
import { 
  X, 
  Info, 
  TrendingUp, 
  Star, 
  ThumbsUp, 
  Check, 
  Plus, 
  MessageSquare, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Vendor } from '../../types/database';

interface CustomerRestaurantReviewsModalProps {
  vendor: Vendor;
  onClose: () => void;
}

interface ReviewItem {
  id: string;
  userName: string;
  isTopReviewer?: boolean;
  rating: number; // 1 to 5
  timeAgo: string;
  comment: string;
  helpfulCount: number;
  hasVotedHelpful?: boolean;
  createdAt: number;
}

export const CustomerRestaurantReviewsModal: React.FC<CustomerRestaurantReviewsModalProps> = ({
  vendor,
  onClose
}) => {
  // Initial reviews matching Screenshot 2 precisely
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    const storageKey = `foodiplace_customer_reviews_${vendor.id}`;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Error reading saved reviews:', e);
      }
    }

    return [
      {
        id: 'rev-001',
        userName: 'Mamun',
        rating: 5,
        timeAgo: '2 weeks ago',
        comment: 'good',
        helpfulCount: 0,
        createdAt: Date.now() - 14 * 24 * 3600 * 1000
      },
      {
        id: 'rev-002',
        userName: 'Sabbir',
        rating: 5,
        timeAgo: '1 month ago',
        comment: 'The food was really good. The biryani tasted great and the portion was pretty decent. Overall, had a good experience.',
        helpfulCount: 0,
        createdAt: Date.now() - 30 * 24 * 3600 * 1000
      },
      {
        id: 'rev-003',
        userName: 'Az',
        isTopReviewer: true,
        rating: 4,
        timeAgo: '2 months ago',
        comment: 'Packaging was solid and delivery was right on time. Taste is consistent with their usual standard. Loved the mint chutney!',
        helpfulCount: 3,
        createdAt: Date.now() - 60 * 24 * 3600 * 1000
      },
      {
        id: 'rev-004',
        userName: 'Farhan Chowdhury',
        rating: 5,
        timeAgo: '3 weeks ago',
        comment: 'Crispy, hot and flavorful. Arrived well within the estimated time. Definitely ordering again!',
        helpfulCount: 5,
        createdAt: Date.now() - 21 * 24 * 3600 * 1000
      }
    ];
  });

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'top' | 'newest' | 'highest' | 'lowest'>('top');

  // Info modal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Write review form state
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newUserName, setNewUserName] = useState('');

  // Persist reviews to localStorage
  const saveReviews = (updated: ReviewItem[]) => {
    setReviews(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`foodiplace_customer_reviews_${vendor.id}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving reviews:', e);
      }
    }
  };

  // Toggle helpful vote
  const toggleHelpful = (id: string) => {
    const updated = reviews.map(r => {
      if (r.id === id) {
        const nextVoted = !r.hasVotedHelpful;
        return {
          ...r,
          hasVotedHelpful: nextVoted,
          helpfulCount: nextVoted ? r.helpfulCount + 1 : Math.max(0, r.helpfulCount - 1)
        };
      }
      return r;
    });
    saveReviews(updated);
  };

  // Submit new review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      userName: newUserName.trim() || 'Food Lover',
      rating: newRating,
      timeAgo: 'Just now',
      comment: newComment.trim(),
      helpfulCount: 0,
      createdAt: Date.now()
    };

    saveReviews([newRev, ...reviews]);
    setNewComment('');
    setIsWriteReviewOpen(false);
  };

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    const list = [...reviews];
    if (activeFilter === 'newest') {
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    if (activeFilter === 'highest') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (activeFilter === 'lowest') {
      return list.sort((a, b) => a.rating - b.rating);
    }
    // Top reviews (default)
    return list.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0) || b.rating - a.rating);
  }, [reviews, activeFilter]);

  // Dynamic Rating calculations
  // Screenshot displays "3.7" or vendor's rating with breakdown
  const avgRatingDisplay = useMemo(() => {
    if (vendor.rating && vendor.rating > 0) {
      return vendor.rating.toFixed(1);
    }
    return '3.7';
  }, [vendor.rating]);

  // Distribution percentages matching Screenshot 2:
  // 5: ~70%, 4: ~15%, 3: ~10%, 2: ~5%, 1: ~20%
  const distributionPercentages: Record<number, number> = {
    5: 68,
    4: 18,
    3: 12,
    2: 6,
    1: 22
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fa] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200 font-sans select-none">
      <div className="max-w-md mx-auto min-h-screen bg-[#f8f9fa] text-slate-900 pb-20 flex flex-col">
        {/* 
          ========================================================================
          TOP HEADER BAR (Matching Screenshot 2)
          - Left: ✕ Close button
          - Center/Left: "Ratings & Reviews", Subtitle: "Ma Biryani - Gulshan"
          - Right: ⓘ Info button
          ========================================================================
        */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-slate-100 shadow-2xs">
          <div className="flex items-center space-x-3 truncate">
            {/* ✕ Close button */}
            <button
              onClick={onClose}
              className="p-1 text-slate-800 hover:text-slate-950 transition cursor-pointer active:scale-90 shrink-0"
              title="Close"
              aria-label="Close"
            >
              <X className="w-6 h-6 stroke-[2.4]" />
            </button>

            {/* Title & Restaurant Outlets Subtitle */}
            <div className="truncate">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Ratings & Reviews
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {vendor.name} - {vendor.zone ? vendor.zone.replace(' Zone', '') : 'Gulshan'}
              </p>
            </div>
          </div>

          {/* ⓘ Info Button */}
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="p-1.5 text-slate-700 hover:text-slate-950 transition cursor-pointer shrink-0"
            title="Rating Info"
            aria-label="Info"
          >
            <Info className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* 
          ========================================================================
          HIGHLIGHTS BANNER (Matching Screenshot 2)
          - Soft rose/pink box: "This restaurant is getting better reviews!"
          ========================================================================
        */}
        <div className="px-4 pt-3">
          <div className="bg-[#fff1f2] border border-[#ffe4e6] rounded-2xl p-3.5 flex items-center space-x-2.5 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <p className="text-xs sm:text-[13px] font-black text-slate-900 tracking-tight leading-snug">
              This restaurant is getting better reviews!
            </p>
          </div>
        </div>

        {/* 
          ========================================================================
          OVERALL RATING CARD (Matching Screenshot 2)
          - Left: 3.7 + Amber Stars + "All ratings (1k+)"
          - Right: 5 ★ down to 1 ★ distribution bars with amber fill
          ========================================================================
        */}
        <div className="mx-4 mt-3 bg-white rounded-3xl border border-slate-100 shadow-2xs p-5">
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Left Column: Big score + stars */}
            <div className="space-y-1.5">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight leading-none">
                {avgRatingDisplay}
              </div>

              {/* 5 Amber Stars */}
              <div className="flex items-center space-x-1 pt-1">
                {[1, 2, 3, 4, 5].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-4 h-4 ${
                      starIdx <= Math.round(Number(avgRatingDisplay))
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-200 text-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="text-xs font-semibold text-slate-500 pt-0.5">
                All ratings (1k+)
              </div>
            </div>

            {/* Right Column: 5 ★ down to 1 ★ Distribution Bars */}
            <div className="space-y-1.5 pl-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const pct = distributionPercentages[stars] || 15;
                return (
                  <div key={stars} className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-700 w-3 text-right">{stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    
                    {/* Progress Bar Track */}
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 
          ========================================================================
          SECTION TITLE: "Reviews"
          ========================================================================
        */}
        <div className="px-4 mt-6 mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Reviews
          </h2>
          <button
            onClick={() => setIsWriteReviewOpen(true)}
            className="text-xs font-black text-rose-600 hover:text-rose-700 flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Write a review</span>
          </button>
        </div>

        {/* 
          ========================================================================
          HORIZONTAL FILTER PILLS (Matching Screenshot 2)
          - Top reviews (active dark pill)
          - Newest
          - Highest rating
          - Lowest rating
          ========================================================================
        */}
        <div className="px-4 mb-4 overflow-x-auto scrollbar-none flex items-center space-x-2.5 pb-1">
          <button
            onClick={() => setActiveFilter('top')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-2xs ${
              activeFilter === 'top'
                ? 'bg-slate-900 text-white font-black'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Top reviews
          </button>

          <button
            onClick={() => setActiveFilter('newest')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-2xs ${
              activeFilter === 'newest'
                ? 'bg-slate-900 text-white font-black'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Newest
          </button>

          <button
            onClick={() => setActiveFilter('highest')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-2xs ${
              activeFilter === 'highest'
                ? 'bg-slate-900 text-white font-black'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Highest rating
          </button>

          <button
            onClick={() => setActiveFilter('lowest')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-2xs ${
              activeFilter === 'lowest'
                ? 'bg-slate-900 text-white font-black'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Lowest rating
          </button>
        </div>

        {/* 
          ========================================================================
          REVIEWS LIST (100% Matching Screenshot 2)
          ========================================================================
        */}
        <div className="space-y-3 px-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-4 space-y-2.5"
            >
              {/* Reviewer Name & Top reviewer badge */}
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm text-slate-900 tracking-tight">
                  {rev.userName}
                </span>

                {rev.isTopReviewer && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black tracking-tight">
                    Top reviewer
                  </span>
                )}
              </div>

              {/* Stars & Time Ago (e.g. ★★★★★ · 2 weeks ago) */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <div className="flex items-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`w-3.5 h-3.5 ${
                        starIdx <= rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span>·</span>
                <span className="text-slate-500 font-medium">{rev.timeAgo}</span>
              </div>

              {/* Comment text */}
              <p className="text-xs sm:text-[13px] text-slate-800 font-medium leading-relaxed">
                {rev.comment}
              </p>

              {/* 👍 Helpful button (Interactive) */}
              <div className="pt-1">
                <button
                  onClick={() => toggleHelpful(rev.id)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 ${
                    rev.hasVotedHelpful
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${rev.hasVotedHelpful ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>Helpful {rev.helpfulCount > 0 ? `(${rev.helpfulCount})` : ''}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 
        ========================================================================
        MODAL: RATING INFO (Triggered by ⓘ button)
        ========================================================================
      */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">Ratings & Reviews Policy</h3>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>Authentic Orders:</strong> Only customers who have placed and received an order from <span className="font-bold text-slate-900">{vendor.name}</span> can submit verified reviews.
              </p>
              <p>
                <strong>Recalculation:</strong> Overall rating scores are dynamically weighted using recent orders from the last 6 months to ensure fresh quality standards.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: WRITE A REVIEW
        ========================================================================
      */}
      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-black text-slate-900 text-base">Rate {vendor.name}</h3>
              </div>
              <button
                onClick={() => setIsWriteReviewOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              {/* Star selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer transition active:scale-90"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= newRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-100 text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-black text-slate-800 ml-2">
                    {newRating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* User Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mamun"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-semibold"
                />
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Feedback / Comment</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details of your food taste, packaging or delivery..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWriteReviewOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition active:scale-95"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
