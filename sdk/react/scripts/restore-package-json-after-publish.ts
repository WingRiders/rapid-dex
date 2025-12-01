/**
 * Restores package.json after publishing to use source paths.
 */

import {existsSync, readFileSync, unlinkSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const packageJsonFilePath = join(import.meta.dir, '..', 'package.json')
const workspaceDepsBackupPath = join(
  import.meta.dir,
  '.workspace-dependencies.json',
)
const packageJsonContent = JSON.parse(
  readFileSync(packageJsonFilePath, 'utf-8'),
)

// Helper function to sort dependencies alphabetically
const sortDependencies = (
  deps: Record<string, string>,
): Record<string, string> => {
  const sortedEntries = Object.entries(deps).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  return Object.fromEntries(sortedEntries)
}

// Restore workspace dependencies if backup exists
if (existsSync(workspaceDepsBackupPath)) {
  const workspaceDependencies = JSON.parse(
    readFileSync(workspaceDepsBackupPath, 'utf-8'),
  )

  if (workspaceDependencies.dependencies) {
    if (!packageJsonContent.dependencies) {
      packageJsonContent.dependencies = {}
    }
    Object.assign(
      packageJsonContent.dependencies,
      workspaceDependencies.dependencies,
    )
    // Sort dependencies alphabetically
    packageJsonContent.dependencies = sortDependencies(
      packageJsonContent.dependencies,
    )
  }

  if (workspaceDependencies.devDependencies) {
    if (!packageJsonContent.devDependencies) {
      packageJsonContent.devDependencies = {}
    }
    Object.assign(
      packageJsonContent.devDependencies,
      workspaceDependencies.devDependencies,
    )
    // Sort devDependencies alphabetically
    packageJsonContent.devDependencies = sortDependencies(
      packageJsonContent.devDependencies,
    )
  }

  // Remove backup file
  unlinkSync(workspaceDepsBackupPath)
}

packageJsonContent.main = './src/index.ts'
packageJsonContent.module = './src/index.ts'
packageJsonContent.exports = {
  '.': {
    types: './src/index.ts',
    import: './src/index.ts',
    default: './src/index.ts',
  },
}

writeFileSync(
  packageJsonFilePath,
  `${JSON.stringify(packageJsonContent, null, 2)}\n`,
)

console.log('✓ Restored package.json after publishing')
