import { useState, useEffect, useRef } from 'react';

/**
 * Hook para lazy loading de componentes pesados
 * Mejora el rendimiento al diferir la carga de módulos grandes
 * 
 * @param callback - Función que retorna Promise<{ default: React.ComponentType }>
 * @param options - { delay: ms antes de cargar, threshold: para intersection observer }
 */
export function useLazyLoad<T>(
  callback: () => Promise<{ default: T }>,
  options?: { delay?: number; threshold?: number }
) {
  const [component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const delay = options?.delay ?? 200;
    const threshold = options?.threshold ?? 0.1;

    // Usar Intersection Observer para cargar cuando sea visible
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && elementRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            timeoutRef.current = setTimeout(async () => {
              try {
                setIsLoading(true);
                const module = await callback();
                setComponent(module.default);
              } catch (err) {
                setError(err instanceof Error ? err : new Error('Error loading component'));
              } finally {
                setIsLoading(false);
              }
            }, delay);

            // Desconectar después de cargar
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        },
        { threshold }
      );

      observerRef.current.observe(elementRef.current);
    } else {
      // Fallback: cargar inmediatamente si no hay Intersection Observer
      timeoutRef.current = setTimeout(async () => {
        try {
          setIsLoading(true);
          const module = await callback();
          setComponent(module.default);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Error loading component'));
        } finally {
          setIsLoading(false);
        }
      }, delay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [callback, options?.delay, options?.threshold]);

  return { component, isLoading, error, elementRef };
}

/**
 * Hook para prefetch de rutas
 * Precarga módulos en background cuando hay conexión rápida
 */
export function usePrefetchRoute(routePath: string) {
  useEffect(() => {
    // Solo prefetch en web y con buena conexión
    if (typeof window === 'undefined') return;

    // Usar requestIdleCallback si está disponible
    const callback = (window as any).requestIdleCallback ?? ((fn: () => void) => {
      setTimeout(fn, 250);
    });

    callback(() => {
      // Prefetch usando dynamic import
      import(routePath).catch(() => {
        // Silent fail - es solo un prefetch
      });
    });
  }, [routePath]);
}
