export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { detectTextKo } from '@/lib/vision';
import { matchSku } from '@/lib/match';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const auditLog: {
  entries: Array<{
    timestamp: string;
    score: number;
    code: string | null;
    alternatives: string[];
    bytes: number;
    ocrChars: number;
  }>;
} = { entries: [] };

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Tipo de archivo no soportado' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Archivo demasiado grande (máx 5MB)' }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ocrText = await detectTextKo(buffer);
    if (!ocrText) {
      return NextResponse.json({ error: 'No se detectó texto en la imagen.' }, { status: 422 });
    }

    const { match, alternatives } = await matchSku(ocrText);
    if (!match) {
      return NextResponse.json({ error: 'No se encontraron coincidencias.' }, { status: 404 });
    }

    auditLog.entries.push({
      timestamp: new Date().toISOString(),
      score: match.score,
      code: match.code,
      alternatives: alternatives.map((alt) => alt.code),
      bytes: buffer.byteLength,
      ocrChars: ocrText.length,
    });
    // TODO: Persistir auditorías en Postgres/Firestore.

    return NextResponse.json(
      {
        match,
        alternatives,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Error interno al procesar la imagen.' },
      { status: 500 }
    );
  }
}
