'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

type CameraCaptureProps = {
  onCapture: (file: File, previewUrl: string) => void;
  disabled?: boolean;
};

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;
const FALLBACK_JPEG_QUALITY = 0.7;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

async function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((value) => resolve(value), 'image/jpeg', quality)
  );
  if (!blob) {
    throw new Error('No se pudo comprimir la imagen.');
  }
  return blob;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo generar la vista previa.'));
    reader.readAsDataURL(blob);
  });
}

async function resizeFile(file: File): Promise<{ file: File; dataUrl: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer]);
  const imageUrl = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = imageUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
  });

  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo preparar el lienzo.');
  }
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  let blobResult = await canvasToJpeg(canvas, JPEG_QUALITY);
  if (blobResult.size > MAX_UPLOAD_BYTES) {
    const fallbackBlob = await canvasToJpeg(canvas, FALLBACK_JPEG_QUALITY);
    if (fallbackBlob.size < blobResult.size) {
      blobResult = fallbackBlob;
    }
    if (blobResult.size > MAX_UPLOAD_BYTES) {
      throw new Error('La imagen procesada supera 4MB. Usa una foto con menos resolución.');
    }
  }
  const resizedFile = new File([blobResult], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
  const dataUrl = await blobToDataUrl(blobResult);
  URL.revokeObjectURL(imageUrl);
  return { file: resizedFile, dataUrl };
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      setIsStreaming(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo acceder a la cámara. Usa la carga manual.');
    }
  }, []);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      setError('La cámara todavía no está lista.');
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('No se pudo capturar la imagen.');
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.9)
    );
    if (!blob) {
      setError('No se pudo obtener la foto.');
      return;
    }
    const file = new File([blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' });
    try {
      const { file: resizedFile, dataUrl } = await resizeFile(file);
      onCapture(resizedFile, dataUrl);
    } catch (err) {
      console.error(err);
      setError('No se pudo procesar la imagen.');
    }
  }, [onCapture]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files?.[0];
      if (!selected) return;
      try {
        const { file: resizedFile, dataUrl } = await resizeFile(selected);
        onCapture(resizedFile, dataUrl);
      } catch (err) {
        console.error(err);
        setError('No se pudo procesar la imagen seleccionada.');
      }
    },
    [onCapture]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="rounded-md bg-accent px-4 py-2 font-semibold text-white disabled:opacity-50"
          onClick={startCamera}
          disabled={disabled || isStreaming}
        >
          {isStreaming ? 'Cámara lista' : 'Activar cámara'}
        </button>
        {isStreaming && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg border border-gray-300"
              aria-label="Vista previa de la cámara"
            />
            <button
              type="button"
              className="rounded-md border border-accent px-4 py-2 font-semibold text-accent disabled:opacity-50"
              onClick={handleCapture}
              disabled={disabled}
            >
              Capturar foto
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-medium" htmlFor="file-input">
          Cargar foto (si la cámara no está disponible)
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={disabled}
          className="rounded-md border border-dashed border-gray-400 p-3"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
