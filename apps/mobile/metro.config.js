// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the whole workspace so edits in packages/shared trigger a reload.
config.watchFolders = [workspaceRoot]

// Resolve from the app first, then the workspace root. pnpm keeps real packages
// in .pnpm and links them, so both paths are needed.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// pnpm's default linker symlinks everything; without this Metro resolves a
// dependency to the symlink target and can end up with two copies of React.
config.resolver.unstable_enableSymlinks = true
config.resolver.disableHierarchicalLookup = true

module.exports = config
