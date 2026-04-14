import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit + fontkit use legacy decorators that Turbopack can't parse.
  // Marking them as server-external loads them as native Node modules at
  // runtime inside the serverless function instead of bundling them.
  serverExternalPackages: ["pdfkit", "fontkit"],
};

export default nextConfig;
