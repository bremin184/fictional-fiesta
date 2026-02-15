import { useState, useEffect, useCallback } from 'react';

interface UseServerHealthResult {
    isHealthy: boolean | null;
    isChecking: boolean;
    lastChecked: Date | null;
    error: string | null;
    checkHealth: () => Promise<boolean>;
}

/**
 * Polls the signaling server /health endpoint.
 * Returns null until first check completes.
 */
export function useServerHealth(serverBaseUrl?: string): UseServerHealthResult {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getBaseUrl = (): string => {
        if (serverBaseUrl) return serverBaseUrl;
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
        return `${protocol}://${host}:3001`;
    };

    const checkHealth = useCallback(async (): Promise<boolean> => {
        setIsChecking(true);
        setError(null);
        try {
            const res = await fetch(`${getBaseUrl()}/health`, {
                signal: AbortSignal.timeout(3000),
            });
            const ok = res.ok;
            setIsHealthy(ok);
            setLastChecked(new Date());
            setIsChecking(false);
            return ok;
        } catch (err) {
            setIsHealthy(false);
            setError(err instanceof Error ? err.message : 'Server unreachable');
            setLastChecked(new Date());
            setIsChecking(false);
            return false;
        }
    }, [serverBaseUrl]);

    // Initial check + periodic polling
    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 15000); // every 15s
        return () => clearInterval(interval);
    }, [checkHealth]);

    return { isHealthy, isChecking, lastChecked, error, checkHealth };
}
