"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

type Props = {
  onRecordingAdded: () => void; // callback to refresh recordings
};

export default function RecordingForm({ onRecordingAdded }: Props) {
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [orchestra, setOrchestra] = useState("");
  const [conductor, setConductor] = useState("");
  const [performers, setPerformers] = useState("");
  const [year, setYear] = useState<number>(2023);
  const [genre, setGenre] = useState("");
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState<number>(0); // seconds
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("recordings").insert([
      {
        title,
        composer,
        orchestra,
        conductor,
        performers: performers.split(",").map((p) => p.trim()),
        year,
        genre,
        label,
        duration,
        cover_url: coverUrl,
      },
    ]);

    if (error) {
      setMessage(error.message);
    } else {
      setTitle("");
      setComposer("");
      setOrchestra("");
      setConductor("");
      setPerformers("");
      setYear(2023);
      setGenre("");
      setLabel("");
      setDuration(0);
      setCoverUrl("");
      setMessage("Recording added!");
      onRecordingAdded();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h3>Add New Recording</h3>
      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <br />
      <input type="text" placeholder="Composer" value={composer} onChange={(e) => setComposer(e.target.value)} required />
      <br />
      <input type="text" placeholder="Orchestra" value={orchestra} onChange={(e) => setOrchestra(e.target.value)} />
      <br />
      <input type="text" placeholder="Conductor" value={conductor} onChange={(e) => setConductor(e.target.value)} />
      <br />
      <input type="text" placeholder="Performers (comma separated)" value={performers} onChange={(e) => setPerformers(e.target.value)} />
      <br />
      <input type="number" placeholder="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      <br />
      <input type="text" placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
      <br />
      <input type="text" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <br />
      <input type="number" placeholder="Duration (seconds)" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
      <br />
      <input type="text" placeholder="Cover Image URL" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
      <br />
      <button type="submit" disabled={loading} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}>
        {loading ? "Adding…" : "Add Recording"}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
