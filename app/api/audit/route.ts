import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const confirmations: {
  entries: Array<{
    timestamp: string;
    imageId?: string;
    confirmedCode: string;
  }>;
} = { entries: [] };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { confirmedCode, imageId } = body as { confirmedCode?: string; imageId?: string };
    if (!confirmedCode) {
      return NextResponse.json({ error: 'confirmedCode es obligatorio' }, { status: 400 });
    }

    confirmations.entries.push({
      timestamp: new Date().toISOString(),
      imageId,
      confirmedCode,
    });
    // TODO: Persistir confirmaciones en Postgres/Firestore.

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al registrar la auditoría.' }, { status: 500 });
  }
}
