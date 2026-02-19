"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import RecordingForm from "./RecordingForm";

type Recording = {
  id: string;
  title: string;
  composer: string;
  orchestra: string;
  conductor: string;
  performers: string[];
  year: number;
  label: string;
  duration: number;
  cover_url: string;
  genre: string;
};

type Review = {
  id: string;
  recording_id: string;
  user_id: string;
  rating: number;
  text: string;
  user_email: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Record<string, Review[]>>({});
  const [avgRatings, setAvgRatings] = useState<Record<string, number>>({});

  // -----------------------------
// Auth & session handling (FIXED)
// -----------------------------
useEffect(() => {
  let sub: ReturnType<typeof supabase.auth.onAuthStateChange>["data"]["subscription"] | null = null;
  let cancelled = false;

  const init = async () => {
    // 1) Try immediately
    const { data: { session } } = await supabase.auth.getSession();
    if (cancelled) return;

    if (session?.user) {
      setUser(session.user);
      setLoading(false);
      return;
    }

    // 2) Wait for auth state changes (OAuth restore)
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        setLoading(false);
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        router.replace("/login");
      }
    });

    sub = data.subscription;

    // 3) Fallback: if no session after a short delay, then go to login
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && !session?.user) {
        setLoading(false);
        router.replace("/login");
      }
    }, 1500);
  };

  init();

  return () => {
    cancelled = true;
    sub?.unsubscribe();
  };
}, [router]);



  // -----------------------------
  // Fetch recordings & reviews (client-side)
  // -----------------------------
  const fetchRecordingsAndReviews = async () => {
    try {
      const { data: recData, error: recError } = await supabase.from("recordings").select("*");
      if (recError) throw recError;
      setRecordings(recData || []);

      const { data: reviewData, error: reviewError } = await supabase.from("reviews").select("*");
      if (reviewError) throw reviewError;

      const map: Record<string, Review[]> = {};
      (reviewData || []).forEach((rev) => {
        if (!map[rev.recording_id]) map[rev.recording_id] = [];
        map[rev.recording_id].push({
          ...rev,
          user_email: (rev as any).user?.email || "Unknown",
        });
      });
      setReviewsMap(map);

      const avgMap: Record<string, number> = {};
      Object.keys(map).forEach((recId) => {
        const revs = map[recId];
        const sum = revs.reduce((acc, r) => acc + r.rating, 0);
        avgMap[recId] = sum / revs.length;
      });
      setAvgRatings(avgMap);
    } catch (err: any) {
      console.error("Error fetching recordings/reviews:", err);
    }
  };

  useEffect(() => {
    if (user) fetchRecordingsAndReviews();
  }, [user]);

  if (loading) return <p>Loading dashboard…</p>;

  // -----------------------------
  // Review Form component
  // -----------------------------
  const ReviewForm = ({
    recordingId,
    existingReview,
    onSuccess,
  }: {
    recordingId: string;
    existingReview?: Review;
    onSuccess: () => void;
  }) => {
    const [rating, setRating] = useState(existingReview?.rating || 5);
    const [text, setText] = useState(existingReview?.text || "");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setMessage("");

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setMessage("You must be logged in to submit a review.");
        setSubmitting(false);
        return;
      }

      try {
        if (existingReview) {
          const { error } = await supabase.from("reviews").update({ rating, text }).eq("id", existingReview.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("reviews").insert([
            { recording_id: recordingId, user_id: session.user.id, rating, text },
          ]);
          if (error) throw error;
        }

        await onSuccess();
        setMessage(existingReview ? "Review updated!" : "Review submitted!");
        setText("");
        setRating(5);
      } catch (err: any) {
        console.error("Supabase review error:", err);
        setMessage(err.message || JSON.stringify(err));
      }

      setSubmitting(false);
    };

    return (
      <form onSubmit={handleSubmit} style={{ marginTop: "0.5rem" }}>
        <label>
          Rating:{" "}
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} ⭐</option>
            ))}
          </select>
        </label>
        <br />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your review..."
          style={{ width: "100%", height: "60px", marginTop: "0.5rem" }}
        />
        <br />
        <button type="submit" disabled={submitting} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}>
          {existingReview ? "Update Review" : "Submit Review"}
        </button>
        {message && <p>{message}</p>}
      </form>
    );
  };

  // -----------------------------
  // Delete review
  // -----------------------------
  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await supabase.from("reviews").delete().eq("id", reviewId);
      fetchRecordingsAndReviews();
    } catch (err) {
      console.error("Delete review error:", err);
    }
  };

  // -----------------------------
  // Dashboard JSX
  // -----------------------------
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome to Cadenza!</h1>
      {user && <p>Logged in as: {user.email}</p>}
      <p>This is your dashboard. Add recordings, reviews, and more below.</p>

      <h2 style={{ marginTop: "2rem" }}>Recordings</h2>
      <RecordingForm onRecordingAdded={fetchRecordingsAndReviews} />

      {recordings.length === 0 && <p>No recordings yet.</p>}

      {recordings.map((rec) => (
        <div key={rec.id} style={{ marginBottom: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h3>{rec.title} ({rec.year})</h3>
          <p><strong>Composer:</strong> {rec.composer}</p>
          <p><strong>Orchestra:</strong> {rec.orchestra}</p>
          <p><strong>Conductor:</strong> {rec.conductor}</p>
          <p><strong>Performers:</strong> {rec.performers.join(", ")}</p>

          <p>
            <strong>Average Rating:</strong>{" "}
            {avgRatings[rec.id]
              ? "⭐".repeat(Math.floor(avgRatings[rec.id])) +
                (avgRatings[rec.id] % 1 >= 0.5 ? "½" : "")
              : "No ratings yet"}
          </p>

          <h4>Reviews:</h4>
          {reviewsMap[rec.id]?.length > 0 ? (
            <ul>
              {reviewsMap[rec.id].map((rev) => (
                <li key={rev.id} style={{ marginBottom: "0.5rem" }}>
                  <strong>{rev.user_email}:</strong> {" "}
                  {"⭐".repeat(rev.rating)} — {rev.text} {" "}
                  {user?.id === rev.user_id && (
                    <>
                      <button onClick={() => handleDelete(rev.id)} style={{ marginLeft: "1rem" }}>Delete</button>
                      <ReviewForm
                        recordingId={rec.id}
                        existingReview={rev}
                        onSuccess={fetchRecordingsAndReviews}
                      />
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No reviews yet.</p>
          )}

          <ReviewForm
            recordingId={rec.id}
            onSuccess={fetchRecordingsAndReviews}
          />
        </div>
      ))}
    </div>
  );
}
