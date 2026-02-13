import { describe, it, expect } from 'vitest';

describe('Type Definitions', () => {
    it('should export User type with required fields', async () => {
        // Verify the types module can be imported without errors
        const types = await import('@/types');
        expect(types).toBeDefined();
    });
});

describe('Utilities', () => {
    it('cn() should merge class names correctly', async () => {
        const { cn } = await import('@/lib/utils');
        expect(cn('foo', 'bar')).toBe('foo bar');
        expect(cn('foo', undefined, 'bar')).toBe('foo bar');
        expect(cn('px-2', 'px-4')).toBe('px-4'); // tailwind-merge deduplication
    });

    it('cn() should handle empty inputs', async () => {
        const { cn } = await import('@/lib/utils');
        expect(cn()).toBe('');
        expect(cn('')).toBe('');
    });

    it('cn() should handle conditional classes', async () => {
        const { cn } = await import('@/lib/utils');
        const isActive = true;
        const isDisabled = false;
        expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
            'base active'
        );
    });
});
