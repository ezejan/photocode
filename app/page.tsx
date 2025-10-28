"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const onScan = async () => {
    if (!file) {
      setError("Subí una foto primero");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ocr-match", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResult(json);
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        PhotoCode — Identificar código por foto
      </h1>

      <p style={{ marginBottom: 12 }}>
        Sacá una foto de la cara de la caja (texto coreano legible) o subí una imagen.
      </p>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onChange}
        style={{ marginBottom: 12 }}
      />

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={onScan}
          disabled={loading || !file}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #111" }}
        >
          {loading ? "Procesando..." : "Escanear"}
        </button>
      </div>

      {error && <pre style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</pre>}
      {result && (
        <div style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Resultado</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
