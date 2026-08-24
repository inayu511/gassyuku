const path = require('node:path');
const { defineConfig } = require('vitest/config');

module.exports = defineConfig(async () => {
  const { default: react } = await import('@vitejs/plugin-react');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname),
      },
    },
    test: {
      environment: 'node',
      pool: 'forks',
      globals: false,
      clearMocks: true,
      restoreMocks: true,
      unstubGlobals: true,
    },
  };
});
