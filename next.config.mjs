/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================================
  // COMPILER OPTIMIZATIONS
  // ============================================================================

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Remove console.log in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // ============================================================================
  // BUNDLE OPTIMIZATIONS
  // ============================================================================

  // Tree-shake specific packages for smaller bundles
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
  },

  // ============================================================================
  // IMAGE OPTIMIZATION
  // ============================================================================

  images: {
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Optimize device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimize image processing
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    // Disable image optimization if not using next/image heavily
    unoptimized: false,
  },

  // ============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================================================

  // Enable experimental optimizations
  experimental: {
    // optimizeCss requires 'critters' package - disabled for now
    // optimizeCss: true,
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-switch',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      'zustand',
      'zod',
    ],
  },

  // ============================================================================
  // CACHING & HEADERS
  // ============================================================================

  async headers() {
    return [
      {
        // Apply to all static assets
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Apply to JS/CSS chunks
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // ============================================================================
  // BUILD OPTIMIZATIONS
  // ============================================================================

  // Generate ETags for caching
  generateEtags: true,

  // Compress responses
  compress: true,

  // Strict mode for better React performance
  reactStrictMode: true,

  // Disable x-powered-by header
  poweredByHeader: false,

  // ============================================================================
  // OUTPUT CONFIGURATION
  // ============================================================================

  // Note: 'standalone' output is for Docker deployments
  // Vercel handles output automatically - do not set 'output' for Vercel

  // ============================================================================
  // WEBPACK OPTIMIZATIONS
  // ============================================================================

  webpack: (config, { isServer, dev }) => {
    // Production optimizations only
    if (!dev) {
      // Enable aggressive tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
      };
    }

    // Ignore optional dependencies that cause warnings
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

export default nextConfig;
