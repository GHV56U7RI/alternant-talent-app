import { describe, it, expect } from 'vitest';
import { isFranceOrDomTom } from '../functions/api/_lib/ingest.js';

describe('isFranceOrDomTom', () => {
  it('detects French mainland locations regardless of case', () => {
    expect(isFranceOrDomTom('PARIS')).toBe(true);
    expect(isFranceOrDomTom('paris')).toBe(true);
  });

  it('detects DOM-TOM locations regardless of case', () => {
    expect(isFranceOrDomTom('GUADELOUPE')).toBe(true);
    expect(isFranceOrDomTom('guadeloupe')).toBe(true);
  });

  it('returns false for non-French locations', () => {
    expect(isFranceOrDomTom('New York')).toBe(false);
  });
});
