import { describe, it, expect } from 'vitest';
import { games } from '@/data/games';

describe('Games Data', () => {
    it('should have at least one game defined', () => {
        expect(games.length).toBeGreaterThan(0);
    });

    it('every game should have required fields', () => {
        games.forEach((game) => {
            expect(game.id).toBeDefined();
            expect(game.name).toBeDefined();
            expect(game.description).toBeDefined();
            expect(game.icon).toBeDefined();
            expect(typeof game.supportsAI).toBe('boolean');
        });
    });

    it('game IDs should be unique', () => {
        const ids = games.map((g) => g.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have games that support AI', () => {
        const aiGames = games.filter((g) => g.supportsAI);
        expect(aiGames.length).toBeGreaterThan(0);
    });

    it('games should have valid categories', () => {
        const validCategories = ['strategy', 'trivia', 'party', 'casual'];
        games.forEach((game) => {
            expect(validCategories).toContain(game.category);
        });
    });
});
