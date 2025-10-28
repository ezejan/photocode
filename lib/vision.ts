import vision from '@google-cloud/vision';

let client: vision.ImageAnnotatorClient | null = null;

export function getVisionClient(): vision.ImageAnnotatorClient {
  if (!client) {
    client = new vision.ImageAnnotatorClient();
  }
  return client;
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const detectionClient = getVisionClient();
  const [result] = await detectionClient.documentTextDetection({
    image: { content: buffer },
    imageContext: { languageHints: ['ko'] },
  });
  return result.fullTextAnnotation?.text ?? '';
}
