// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// ============================================
// 🚀 OPTIMIZACIÓN 1: Caché Mejorado
// ============================================
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// ============================================
// 🚀 OPTIMIZACIÓN 2: Excluir Directorios Innecesarios
// ============================================
config.watchFolders = [__dirname];
config.resolver.blacklistRE = /(.*)\/(__tests__|android|ios|build|dist|\.git|\.next|coverage|node_modules\/.*\/(android|ios|windows|macos|__tests__|\.git|.*\.android|.*\.ios))(\/.*)?$/;

// ============================================
// 🚀 OPTIMIZACIÓN 3: Workers Reducidos
// ============================================
config.maxWorkers = 2;

// ============================================
// 🚀 OPTIMIZACIÓN 4: Minificación Agresiva
// ============================================
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: false,
    output: {
      comments: false,
    },
    compress: {
      drop_console: true,
      evaluate: true,
      reduce_vars: true,
    },
  },
  minifierPath: 'metro-minify-terser',
};

// ============================================
// 🚀 OPTIMIZACIÓN 5: Optimizaciones de Red
// ============================================
config.resetCache = process.env.RESET_CACHE === 'true';

// ============================================
// 🚀 WEB CONFIG: Full-width layout sin phone frame
// ============================================
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Inyectar headers para deshabilitar phone frame y usar full-width
      res.setHeader('X-UA-Compatible', 'IE=edge');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      // Deshabilitar phone frame
      process.env.EXPO_WEB_USE_PHONE_FRAME = 'false';
        next();
      };
    },
  };
}

module.exports = config;

module.exports = config;
