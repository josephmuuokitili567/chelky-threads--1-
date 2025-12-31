import React, { useState, useEffect } from 'react';
import { Star, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Review } from '../types';

interface ReviewComponentProps {
  productId: string;
}

const ReviewComponent: React.FC<ReviewComponentProps> = ({ productId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/product/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      setReviews(data);

      // Calculate average rating
      if (data.length > 0) {
        const avg = data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setReviewCount(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to leave a review');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      setSuccess(true);
      setRating(5);
      setComment('');
      setTimeout(() => setSuccess(false), 3000);
      fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating: React.FC<{ value: number; onHover: (val: number) => void; onLeave: () => void; onClick: (val: number) => void; interactive?: boolean }> = ({
    value,
    onHover,
    onLeave,
    onClick,
    interactive = false
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type={interactive ? 'button' : 'div'}
          onMouseEnter={() => interactive && onHover(star)}
          onMouseLeave={() => interactive && onLeave()}
          onClick={() => interactive && onClick(star)}
          title={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : `${star} star${star > 1 ? 's' : ''}`}
          className={`transition-colors ${interactive ? 'cursor-pointer' : ''} ${
            star <= (interactive ? hoverRating || value : value)
              ? 'text-yellow-400'
              : 'text-slate-300'
          }`}
        >
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Customer Reviews</h3>

        {/* Rating Summary */}
        <div className="bg-slate-50 p-6 rounded-lg mb-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900">{averageRating}</div>
              <StarRating value={Math.round(averageRating)} onHover={() => {}} onLeave={() => {}} onClick={() => {}} />
              <p className="text-sm text-slate-500 mt-2">{reviewCount} reviews</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        {user ? (
          <form onSubmit={handleSubmitReview} className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Leave a Review</h4>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Thank you! Your review has been submitted.</span>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-3">Rating</label>
              <StarRating
                value={rating}
                onHover={setHoverRating}
                onLeave={() => setHoverRating(0)}
                onClick={setRating}
                interactive={true}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this product..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none resize-none"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-2">{comment.length}/500 characters</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-gold hover:bg-yellow-600 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="bg-slate-50 p-6 rounded-lg mb-8 text-center">
            <p className="text-slate-600">Please <a href="/login" className="text-brand-gold font-bold hover:underline">log in</a> to leave a review.</p>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-slate-500 text-center py-8">Loading reviews...</p>
        ) : reviews.length > 0 ? (
          reviews.map(review => (
            <div key={review.id} className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{review.customerName}</p>
                  <p className="text-xs text-slate-500">{new Date(review.date).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-700">{review.comment}</p>
              {review.verified && (
                <div className="mt-3 text-xs font-bold text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Verified Purchase
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
    </div>
  );
};

export default ReviewComponent;
