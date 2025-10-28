import { ImageAnnotatorClient } from "@google-cloud/vision";

let client: ImageAnnotatorClient | null = null;

/**
 * Crea/reusa el cliente de Vision leyendo credenciales desde
 * process.env.GCP_CREDENTIALS_JSON (Service Account JSON completo).
 */
function getClient(): ImageAnnotatorClient {
  if (client) return client;

  const raw = process.env.GCP_CREDENTIALS_JSON;
  if (!raw) {
    throw new Error(
      "Falta la variable de entorno GCP_CREDENTIALS_JSON con el JSON de Service Account"
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GCP_CREDENTIALS_JSON no es un JSON válido");
  }

  client = new ImageAnnotatorClient({
    credentials: {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    },
    projectId: parsed.project_id,
  });

  return client;
}

/**
 * Corre OCR (coreano) sobre un Buffer de imagen y devuelve el texto completo.
 */
export async function detectTextKo(buffer: Buffer): Promise<string> {
  const c = getClient();

  // En v5, el request recomendado es con objeto { image: { content }, imageContext }
  const [result] = await c.documentTextDetection({
    image: { content: buffer },
    imageContext: { languageHints: ["ko"] },
  });

  return result?.fullTextAnnotation?.text ?? "";
}

export { getClient as getVisionClient };
