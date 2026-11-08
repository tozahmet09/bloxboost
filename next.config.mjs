/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Nobody can put Spawnswap inside a frame on their site (stops click-jacking tricks on Buy / Log in).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig = {
  poweredByHeader: false,
  // The trailer check runs the ffmpeg binary, so it must ship with the server code untouched.
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/dashboard/games/[id]": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/admin/trailers": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  images: { remotePatterns: [{ protocol: "https", hostname: "**.rbxcdn.com" }] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;
