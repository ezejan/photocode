'use client';

import { useEffect, useRef } from 'react';

type MatchResult = {
  code: string;
  brand_line: string;
  flavor: string;
  score: number;
};

type ResultCardProps = {
  status: 'idle' | 'uploading' | 'ocr' | 'matching' | 'done' | 'error';
  message?: string;
  best?: MatchResult;
  alternatives?: MatchResult[];
  previewUrl?: string | null;
  onRetry: () => void;
  onConfirm: (code: string) => void;
  onSelectAlternative: (code: string) => void;
  disableConfirm?: boolean;
};

const statusMessages: Record<ResultCardProps['status'], string> = {
  idle: 'Listo para escanear.',
  uploading: 'Subiendo imagen…',
  ocr: 'Procesando OCR…',
  matching: 'Comparando con catálogo…',
  done: 'Resultado listo.',
  error: 'Ocurrió un error. Reintenta.',
};

export function ResultCard({
  status,
  message,
  best,
  alternatives,
  previewUrl,
  onRetry,
  onConfirm,
  onSelectAlternative,
  disableConfirm,
}: ResultCardProps) {
  const liveRegionRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message ?? statusMessages[status];
    }
  }, [status, message]);

  const hasAlternatives = (alternatives?.length ?? 0) > 0;

  return (
    <section
      className="space-y-4 rounded-lg bg-white p-4 shadow"
      aria-live="polite"
      aria-busy={status === 'uploading' || status === 'ocr' || status === 'matching'}
    >
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-primary">Resultado</h2>
        <p ref={liveRegionRef} className="text-sm text-gray-600" aria-live="polite">
          {message ?? statusMessages[status]}
        </p>
      </header>

      {previewUrl && (
        <figure className="space-y-2">
          <img
            src={previewUrl}
            alt="Foto capturada"
            className="max-h-48 w-full rounded-md object-contain"
          />
          <figcaption className="text-xs text-gray-500">Última captura</figcaption>
        </figure>
      )}

      {best && (
        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-sm uppercase text-gray-500">Código sugerido</p>
          <p className="text-3xl font-bold tracking-wide text-primary">{best.code}</p>
          <p className="text-sm text-gray-600">{best.brand_line}</p>
          <p className="text-sm text-gray-600">Sabor: {best.flavor}</p>
          <p className="text-sm text-gray-500">Confianza: {(best.score * 100).toFixed(1)}%</p>
        </div>
      )}

      {hasAlternatives && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Alternativas sugeridas (selecciona si corresponde):
          </p>
          <ul className="space-y-2">
            {alternatives?.map((alt) => (
              <li key={alt.code}>
                <button
                  type="button"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm hover:border-accent"
                  onClick={() => onSelectAlternative(alt.code)}
                >
                  <span className="font-semibold">{alt.code}</span>{' '}
                  <span className="text-gray-600">{alt.brand_line}</span>
                  <span className="block text-xs text-gray-500">
                    {(alt.score * 100).toFixed(1)}% confianza
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
          onClick={() => best && onConfirm(best.code)}
          disabled={!best || disableConfirm}
        >
          Confirmar
        </button>
        <button
          type="button"
          className="rounded-md border border-primary px-4 py-2 font-semibold text-primary"
          onClick={onRetry}
        >
          Reintentar
        </button>
      </div>
    </section>
  );
}
