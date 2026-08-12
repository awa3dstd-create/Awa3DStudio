import type { NextConfig } from "next";

// GitHub Pages serve bajo subpath: /Awa3DStudio/
// Cloudflare Pages sirve en root: /
// Detectamos dinámicamente para no romper el build existente.
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "Awa3DStudio";

const nextConfig: NextConfig = {
  // GitHub Pages requiere export estático.
  // Cloudflare Pages (original) usa "standalone" — pero ese modo se maneja vía @cloudflare/next-on-pages,
  // no desde next.config. En el build local de Pages también puede ser "export" si no usamos SSR.
  // Para máxima compatibilidad entre los 3 despliegues usamos export condicional:
  output: isGitHubPages ? "export" : "standalone",

  // GitHub Pages necesita basePath = /<repoName>
  basePath: isGitHubPages ? `/${repoName}` : "",
  assetPrefix: isGitHubPages ? `/${repoName}/` : "",

  // Expone basePath al cliente (para registrar SW en el path correcto)
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? `/${repoName}` : "",
  },

  // Las imágenes estáticas deben servirse sin el optimizador de Next
  // (Image Optimization requiere server runtime)
  images: {
    unoptimized: true,
  },

  // Trailing slash para mejor compatibilidad con GitHub Pages
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
