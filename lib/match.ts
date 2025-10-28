import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { detectVolumeTokens, expandSynonyms, normalizeText, tokenSet } from './text';

type SkuRecord = {
  code: string;
  brand_line: string;
  flavor: string;
  units_per_box?: string;
  shelf_life?: string;
};

type IndexedSku = {
  record: SkuRecord;
  tokens: Set<string>;
  hints: Set<string>;
  flavorTokens: Set<string>;
};

type MatchResult = {
  code: string;
  brand_line: string;
  flavor: string;
  score: number;
};

type MatchIndex = {
  docs: IndexedSku[];
};

const BRAND_BOOSTS: Record<string, number> = {
  okf: 0.05,
  hersheys: 0.05,
  hershey: 0.05,
  starbucks: 0.05,
  lotte: 0.04,
  pepsico: 0.03,
};

const FLAVOR_KEYWORDS = new Set([
  'grape',
  'peach',
  'yuzu',
  'lime',
  'muscat',
  'shine',
  'milk',
  'vanilla',
  'mocha',
  'cookies',
  'cream',
  'matcha',
  'green',
  'tea',
  'caramel',
  'hazelnut',
  'pike',
  'place',
  'roast',
  'dark',
  'chocolate',
  'americano',
  'sweetened',
]);

const skuIndexCache: {
  promise?: Promise<MatchIndex>;
} = {};

async function loadSkuMasterFile(): Promise<SkuRecord[]> {
  const filePath = path.join(process.cwd(), 'data', 'sku_master.json');
  const raw = await readFile(filePath, 'utf-8');
  const records = JSON.parse(raw) as SkuRecord[];
  return records;
}

function toTokens(...parts: string[]): Set<string> {
  const tokens = parts
    .flatMap((part) => expandSynonyms(normalizeText(part).split(/\s+/)))
    .map((token) => token.trim())
    .filter(Boolean);
  return new Set(tokens);
}

function extractHints(record: SkuRecord): Set<string> {
  const hints = new Set<string>();
  const normalizedBrand = normalizeText(record.brand_line);
  normalizedBrand.split(/\s+/).forEach((token) => {
    if (!token) return;
    if (/(\d+)(ml|g|l)/.test(token)) {
      hints.add(token);
    }
    if (token.includes('sparkling') || token.includes('coffee') || token.includes('frapp')) {
      hints.add(token);
    }
  });
  const flavorTokens = normalizeText(record.flavor).split(/\s+/);
  flavorTokens.forEach((token) => {
    if (token) hints.add(token);
  });
  return hints;
}

function extractFlavorTokens(record: SkuRecord): Set<string> {
  return new Set(normalizeText(record.flavor).split(/\s+/).filter(Boolean));
}

async function buildIndex(): Promise<MatchIndex> {
  const records = await loadSkuMasterFile();
  const docs = records.map((record) => {
    const tokens = toTokens(record.brand_line, record.flavor, record.code);
    const hints = extractHints(record);
    const flavorTokens = extractFlavorTokens(record);
    return { record, tokens, hints, flavorTokens } satisfies IndexedSku;
  });
  return { docs };
}

async function getIndex(): Promise<MatchIndex> {
  if (!skuIndexCache.promise) {
    skuIndexCache.promise = buildIndex();
  }
  return skuIndexCache.promise;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((token) => b.has(token)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function scoreDoc(doc: IndexedSku, ocrTokens: Set<string>, volumeTokens: Set<string>): number {
  let score = jaccardSimilarity(doc.tokens, ocrTokens);

  doc.hints.forEach((hint) => {
    if (ocrTokens.has(hint)) {
      score += 0.03;
    }
    if (volumeTokens.has(hint)) {
      score += 0.04;
    }
  });

  Object.entries(BRAND_BOOSTS).forEach(([brand, boost]) => {
    if (doc.tokens.has(brand) && ocrTokens.has(brand)) {
      score += boost;
    }
  });

  const flavorConflict = [...FLAVOR_KEYWORDS].some((token) => {
    if (!ocrTokens.has(token)) return false;
    return !doc.flavorTokens.has(token) && FLAVOR_KEYWORDS.has(token);
  });

  if (flavorConflict) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

export async function matchSku(ocrText: string): Promise<{ match: MatchResult; alternatives: MatchResult[] }> {
  const index = await getIndex();
  const ocrTokens = tokenSet(ocrText);
  const volumeTokens = detectVolumeTokens(ocrTokens);
  const scored = index.docs
    .map((doc) => ({
      doc,
      score: scoreDoc(doc, ocrTokens, volumeTokens),
    }))
    .sort((a, b) => b.score - a.score);

  const results: MatchResult[] = scored.map(({ doc, score }) => ({
    code: doc.record.code,
    brand_line: doc.record.brand_line,
    flavor: doc.record.flavor,
    score,
  }));

  return {
    match: results[0],
    alternatives: results.slice(1, 4),
  };
}

export async function loadSkuMaster(): Promise<SkuRecord[]> {
  return loadSkuMasterFile();
}

export async function buildSkuIndex(): Promise<MatchIndex> {
  return getIndex();
}
