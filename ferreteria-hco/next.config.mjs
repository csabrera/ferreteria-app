/** @type {import('next').NextConfig} */

// Security headers — capa básica para F1. CSP estricto con nonces queda para F2
// porque exige refactor de scripts inline de Next. Lo demás cubre los XSS
// genéricos, click-jacking, MIME-sniff y leak de referer al cambiar de host.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Strict-Transport-Security se aplicará en producción detrás de TLS (Railway)
  // a nivel de proxy; agregarlo acá no daña pero no aporta en local HTTP.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // no exponer "X-Powered-By: Next.js"
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
