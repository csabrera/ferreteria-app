/**
 * Rate limiter in-memory (token bucket simple) para proteger endpoints
 * sensibles del brute force. Sirve para F1 con un solo proceso; para
 * producción multi-instancia o serverless real, migrar a Redis / Upstash.
 *
 * Uso:
 *   const limit = rateLimit({ tokens: 5, window: 60_000 });
 *   const result = limit.check(ip);
 *   if (!result.ok) return new Response("Too many requests", { status: 429 });
 */

type Bucket = {
  tokens: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Cuántos requests permitidos por ventana. */
  tokens: number;
  /** Duración de la ventana en milisegundos. */
  window: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function rateLimit(opts: RateLimitOptions) {
  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const existing = buckets.get(key);
      if (!existing || existing.resetAt <= now) {
        // Ventana nueva
        buckets.set(key, {
          tokens: opts.tokens - 1,
          resetAt: now + opts.window,
        });
        return { ok: true, remaining: opts.tokens - 1, retryAfterSec: 0 };
      }
      if (existing.tokens <= 0) {
        return {
          ok: false,
          remaining: 0,
          retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
        };
      }
      existing.tokens -= 1;
      return {
        ok: true,
        remaining: existing.tokens,
        retryAfterSec: 0,
      };
    },
  };
}

/** Limpia buckets expirados periódicamente para no crecer indefinidamente. */
if (typeof globalThis !== "undefined" && !("__rl_sweeper" in globalThis)) {
  // @ts-expect-error marcando flag en globalThis para evitar múltiples timers
  globalThis.__rl_sweeper = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }, 5 * 60_000); // cada 5 minutos
}

/** Extrae IP del request (Next.js / proxy headers). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
