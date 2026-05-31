const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo + pnpm (node-linker=hoisted): all packages land in workspaceRoot/node_modules.
// watchFolders lets Metro bundle files from outside the project root.
// nodeModulesPaths tells the resolver where to look.
// extraNodeModules is a Proxy fallback that maps any unresolved module name
// directly to workspaceRoot/node_modules — required when node-linker=hoisted
// hoists expo packages to root and Metro's hierarchical lookup stops at projectRoot.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enableSymlinks = true;
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_, name) =>
      path.join(workspaceRoot, 'node_modules', String(name)),
  }
);

module.exports = withNativeWind(config, { input: './global.css' });
