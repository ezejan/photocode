import { describe, expect, it } from 'vitest';
import { matchSku } from '../match';

describe('matchSku', () => {
  it('prioriza Shine Muscat cuando se detecta 샤인머스캣', async () => {
    const { match } = await matchSku('OKF 스파클링 제로 샤인머스캣 350ml');
    expect(match.code).toBe('OKFSMUSC');
  });

  it('detecta OKF Sparkling Grape 350ml', async () => {
    const { match } = await matchSku('OKF Sparkling Zero Grape 350ml - Zero Sugar');
    expect(match.code).toBe('OKFSZGRA');
  });

  it('identifica Hershey Kisses Cookies & Cream 146g', async () => {
    const { match } = await matchSku('Hershey Kisses Cookies & Cream 146g Share Pack');
    expect(match.code).toBe('LOWHEKIC');
  });

  it('ofrece alternativas cuando hay empate en Pike Place Roast', async () => {
    const { match, alternatives } = await matchSku('Starbucks Pike Place Roast 275ml Bottle Coffee');
    expect(match.code).toBe('STAPPRBC');
    const alternativeCodes = alternatives.map((alt) => alt.code);
    expect(alternativeCodes).toContain('STAPPRSB');
  });
});
