'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CameraCapture } from '@/components/CameraCapture';
import { ResultCard } from '@/components/ResultCard';

type MatchResult = {
  code: string;
  brand_line: string;
  flavor: string;
  score: number;
};

type OcrMatchResponse = {
  match: MatchResult;
  alternatives?: MatchResult[];
};

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'ocr' | 'matching' | 'done' | 'error'
  >('idle');
  const [message, setMessage] = useState<string | undefined>();
  const [best, setBest] = useState<MatchResult | undefined>();
  const [alternatives, setAlternatives] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const handleCapture = useCallback((file: File, preview: string) => {
    setSelectedFile(file);
    setPreviewUrl(preview);
    setBest(undefined);
    setAlternatives([]);
    setStatus('idle');
    setMessage('Imagen lista. Presiona "Escanear" para continuar.');
    setError(null);
  }, []);

  const canScan = useMemo(
    () => Boolean(selectedFile) && !['uploading', 'ocr', 'matching'].includes(status),
    [selectedFile, status]
  );

  const handleScan = useCallback(async () => {
    if (!selectedFile) {
      setError('Primero captura o carga una imagen.');
      setStatus('error');
      return;
    }

    try {
      setStatus('uploading');
      setMessage('Subiendo imagen…');
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const responsePromise = fetch('/api/ocr-match', {
        method: 'POST',
        body: formData,
      });

      setStatus('ocr');
      const response = await responsePromise;

      if (!response.ok) {
        throw new Error('No se pudo procesar la imagen.');
      }

      setStatus('matching');
      const payload = (await response.json()) as OcrMatchResponse;
      setBest(payload.match);
      setAlternatives(payload.alternatives ?? []);
      setStatus('done');
      if (payload.match.score < 0.85 && (payload.alternatives?.length ?? 0) > 0) {
        setMessage('Confianza baja. Revisa las alternativas sugeridas.');
      } else {
        setMessage(undefined);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Error durante el escaneo.');
      setError('No se pudo completar el escaneo. Verifica la conexión e inténtalo de nuevo.');
    }
  }, [selectedFile]);

  const handleRetry = useCallback(() => {
    setStatus('idle');
    setMessage('Listo para un nuevo intento.');
    setError(null);
  }, []);

  const handleConfirm = useCallback(
    async (code: string) => {
      try {
        setConfirming(true);
        const response = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmedCode: code }),
        });
        if (!response.ok) {
          throw new Error('No se pudo guardar la auditoría.');
        }
        setMessage('Código confirmado correctamente.');
      } catch (err) {
        console.error(err);
        setError('No se pudo guardar la confirmación.');
      } finally {
        setConfirming(false);
      }
    },
    []
  );

  const handleSelectAlternative = useCallback(
    (code: string) => {
      if (!alternatives.length) return;
      const selected = alternatives.find((alt) => alt.code === code);
      if (!selected) return;
      setBest(selected);
      setMessage(`Se seleccionó manualmente el código ${code}.`);
    },
    [alternatives]
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-primary">Identificar Código de Producto</h1>
        <p className="text-gray-600">
          Captura una foto de la caja, ejecuta OCR y compara contra el catálogo maestro de SKUs.
        </p>
      </header>

      {installPrompt && (
        <div className="rounded-md border border-accent bg-white p-4 text-center shadow-sm">
          <p className="mb-2 font-medium">Instala la aplicación para acceso rápido.</p>
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 font-semibold text-white"
            onClick={handleInstall}
          >
            Instalar app
          </button>
        </div>
      )}

      <section className="rounded-lg bg-white p-4 shadow" aria-labelledby="captura-title">
        <h2 id="captura-title" className="mb-4 text-lg font-semibold text-primary">
          1. Captura o carga la imagen
        </h2>
        <CameraCapture onCapture={handleCapture} disabled={status === 'uploading'} />
      </section>

      <section className="rounded-lg bg-white p-4 shadow" aria-labelledby="escanear-title">
        <h2 id="escanear-title" className="mb-4 text-lg font-semibold text-primary">
          2. Ejecuta el reconocimiento
        </h2>
        <button
          type="button"
          className="w-full rounded-md bg-primary px-4 py-2 text-lg font-semibold text-white disabled:opacity-50"
          onClick={handleScan}
          disabled={!canScan}
        >
          Escanear
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </section>

      <ResultCard
        status={status}
        message={message}
        best={best}
        alternatives={alternatives}
        previewUrl={previewUrl}
        onRetry={handleRetry}
        onConfirm={handleConfirm}
        onSelectAlternative={handleSelectAlternative}
        disableConfirm={confirming}
      />
    </main>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
