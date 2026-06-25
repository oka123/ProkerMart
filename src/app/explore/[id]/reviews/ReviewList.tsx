"use client";

import { useState } from "react";
import { Star, Filter, MessageSquare } from "lucide-react";
import type { ReviewWithUser } from "@/lib/supabase/queries/review";

interface ReviewListProps {
  initialReviews: ReviewWithUser[];
}

export function ReviewList({ initialReviews }: ReviewListProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const reviews = initialReviews;

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Determine reviews to show
  const filteredReviews = filterRating
    ? reviews.filter((r) => r.rating === filterRating)
    : reviews;

  return (
    <div className="w-full p-6 bg-white border shadow-sm rounded-2xl border-slate-200 md:p-8">
      {/* Grid: Rating Overview */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        {/* Average Score */}
        <div className="flex flex-col items-center justify-center pb-6 text-center border-b md:pb-0 md:border-b-0 md:border-r border-slate-150">
          <span className="mb-2 text-5xl font-extrabold tracking-tight text-blue-600">
            {avgRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.round(avgRating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            {reviews.length} Ulasan
          </span>
        </div>

        {/* Rating Bars */}
        <div className="flex flex-col justify-center gap-2 md:col-span-2 md:pl-4">
          {[5, 4, 3, 2, 1].map((ratingVal) => {
            const count = reviews.filter((r) => r.rating === ratingVal).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={ratingVal} className="flex items-center gap-3 text-sm">
                <span className="w-3 font-semibold text-slate-700">
                  {ratingVal}
                </span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 bg-blue-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 font-medium text-right text-slate-500">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Section */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex items-center gap-2 mr-2 text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          <button
            onClick={() => setFilterRating(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterRating === null
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            Semua
          </button>
          {[5, 4, 3, 2, 1].map((ratingVal) => {
            const count = reviews.filter((r) => r.rating === ratingVal).length;
            if (count === 0) return null;
            return (
              <button
                key={`filter-${ratingVal}`}
                onClick={() => setFilterRating(ratingVal)}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterRating === ratingVal
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    filterRating === ratingVal
                      ? "text-white fill-white"
                      : "text-amber-400 fill-amber-400"
                  }`}
                />
                {ratingVal}
              </button>
            );
          })}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => {
            const initials = review.pengguna?.nama
              ? review.pengguna.nama
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "?";

            return (
              <div
                key={review.id_ulasan}
                className="flex gap-4 p-5 border shadow-xs bg-slate-50 rounded-xl border-slate-200"
              >
                {/* Initials Avatar */}
                <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-full shadow-xs bg-linear-to-tr from-blue-500 to-blue-600 shrink-0">
                  {initials}
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col justify-between gap-1 mb-2 sm:flex-row sm:items-center">
                    <h4 className="text-sm font-bold truncate text-slate-800">
                      {review.pengguna?.nama || "Pembeli ProkerMart"}
                    </h4>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(review.tgl_ulasan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment Text */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
                    {review.komentar || "Tidak ada komentar tertulis."}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center border bg-slate-50 rounded-xl border-slate-200">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">
              {filterRating
                ? `Tidak ada ulasan dengan rating ${filterRating}.`
                : "Belum ada ulasan untuk produk ini."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
