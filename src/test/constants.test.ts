import { describe, it, expect } from 'vitest';
import { DECKS } from '../features/room/constants';

describe('DECKS', () => {
  it('should have a simplified deck', () => {
    expect(DECKS.simplified).toEqual(['0', '1', '2', '3', '5', '8', '13', '?']);
  });

  it('should have a standard deck', () => {
    expect(DECKS.standard).toEqual(['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '144', '?']);
  });

  it('should have a modified deck', () => {
    expect(DECKS.modified).toEqual(['0', '1/2', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?']);
  });
});
