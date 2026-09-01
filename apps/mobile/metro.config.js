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

// pnpm links packages rather than copying them, so Metro has to follow symlinks.
config.resolver.unstable_enableSymlinks = true

// Hierarchical lookup must stay ON for pnpm. Its isolated store puts a package's
// own dependencies in a sibling directory —
//   .pnpm/@react-navigation+native@7.3.18_.../node_modules/@react-navigation/core
// — which Metro can only reach by walking up from the importing file. Turning it
// off (the usual advice for yarn/npm monorepos) makes those siblings invisible and
// the build dies with "Unable to resolve module @react-navigation/core".
//
// This passes locally either way, because pnpm falls back to copying on the FUSE
// mount this repo lives on and the layout comes out flat. EAS builds on ext4 with
// real symlinks, so only the CI build catches it.

// pnpm stages installs in directories like `node_modules/@expo/ngrok-bin_tmp_1234`
// and deletes them moments later. Metro's FallbackWatcher — the one it falls back
// to on this filesystem — crawls the workspace and calls fs.watch on whatever it
// finds; if a directory disappears between those two steps it throws an uncaught
// ENOENT and the whole dev server exits. On the phone that looks like
// "Failed to download remote update", because the server is simply gone.
//
// Blocking the temp directories keeps the crawler out of them entirely, so an
// install running alongside `expo start` can no longer kill it.
config.resolver.blockList = [
  /.*[\\/]node_modules[\\/].*_tmp_\d+([\\/].*)?$/,
  /.*[\\/]\.git[\\/].*/,
]

module.exports = config
