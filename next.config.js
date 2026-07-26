const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  sw: "service-worker.js",
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
    "framer-motion": {
      transform: "framer-motion/dist/esm/{{member}}",
    },
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "firebase"],
  },
});
