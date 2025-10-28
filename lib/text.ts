const PUNCTUATION_REGEX = /[.,/#!$%^&*;:{}=\-_`~()\[\]"'“”‘’、·]/g;

export const KO_TO_EN_SYNONYMS: Record<string, string> = {
  '샤인머스캣': 'shine muscat',
  '포도': 'grape',
  '복숭아': 'peach',
  '라임': 'lime',
  '유자': 'yuzu',
  '쿠키앤크림': 'cookies cream',
  '커피': 'coffee',
  '카페라떼': 'cafe latte',
  '카페라테': 'cafe latte',
  '녹차': 'green tea',
  '바닐라': 'vanilla',
};

export function normalizeText(input: string): string {
  return input.toLowerCase().replace(PUNCTUATION_REGEX, ' ');
}

export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function expandSynonyms(tokens: string[]): string[] {
  const expanded = [...tokens];
  tokens.forEach((token) => {
    const synonym = KO_TO_EN_SYNONYMS[token];
    if (synonym) {
      expanded.push(...synonym.split(' '));
    }
  });
  return Array.from(new Set(expanded));
}

export function tokenSet(input: string): Set<string> {
  return new Set(expandSynonyms(tokenize(input)));
}

export function detectVolumeTokens(tokens: Set<string>): Set<string> {
  const matches = new Set<string>();
  const volumeRegex = /(\d+)(ml|g|l)/i;
  tokens.forEach((token) => {
    const normalized = token.replace(/[^0-9a-z]/gi, '');
    const match = normalized.match(volumeRegex);
    if (match) {
      matches.add(match[0]);
    }
  });
  return matches;
}
