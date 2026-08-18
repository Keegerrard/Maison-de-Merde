const isExport = process.env.NEXT_OUTPUT_EXPORT === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isExport ? "export" : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  ...(isExport
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: "http://localhost:3001/api/:path*",
            },
          ];
        },
      }),
};

export default nextConfig;
