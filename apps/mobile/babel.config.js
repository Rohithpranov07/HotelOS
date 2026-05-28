module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Worklets plugin MUST be last (replaces react-native-reanimated/plugin in Reanimated v4)
      'react-native-worklets/plugin',
    ],
    // Strip `import.meta` (used by zustand and others) — apply to all files
    // including node_modules so the web bundle parses outside ES modules.
    overrides: [
      {
        test: () => true,
        plugins: [['babel-plugin-transform-import-meta', { module: 'ES6' }]],
      },
    ],
  };
};
