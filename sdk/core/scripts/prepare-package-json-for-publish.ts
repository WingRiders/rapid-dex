/**
 * Prepares package.json for publishing by swapping source paths to dist paths.
 */

import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

const packageJsonFilePath = join(import.meta.dir, '..', 'package.json')
const workspaceDepsBackupPath = join(
  import.meta.dir,
  '.workspace-dependencies.json',
)
const packageJsonContent = JSON.parse(
  readFileSync(packageJsonFilePath, 'utf-8'),
)

// Save workspace dependencies before removing them
const workspaceDependencies: {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
} = {}

if (packageJsonContent.dependencies) {
  const workspaceDeps: Record<string, string> = {}
  for (const [key, value] of Object.entries(packageJsonContent.dependencies)) {
    if (value === 'workspace:*') {
      workspaceDeps[key] = value
      delete packageJsonContent.dependencies[key]
    }
  }
  if (Object.keys(workspaceDeps).length > 0) {
    workspaceDependencies.dependencies = workspaceDeps
  }
  // Remove dependencies object if empty
  if (Object.keys(packageJsonContent.dependencies).length === 0) {
    delete packageJsonContent.dependencies
  }
}

if (packageJsonContent.devDependencies) {
  const workspaceDevDeps: Record<string, string> = {}
  for (const [key, value] of Object.entries(
    packageJsonContent.devDependencies,
  )) {
    if (value === 'workspace:*') {
      workspaceDevDeps[key] = value
      delete packageJsonContent.devDependencies[key]
    }
  }
  if (Object.keys(workspaceDevDeps).length > 0) {
    workspaceDependencies.devDependencies = workspaceDevDeps
  }
  // Remove devDependencies object if empty
  if (Object.keys(packageJsonContent.devDependencies).length === 0) {
    delete packageJsonContent.devDependencies
  }
}

// Save workspace dependencies backup
writeFileSync(
  workspaceDepsBackupPath,
  `${JSON.stringify(workspaceDependencies, null, 2)}\n`,
)

packageJsonContent.main = './dist/index.mjs'
packageJsonContent.module = './dist/index.mjs'
packageJsonContent.exports = {
  '.': {
    types: './dist/index.d.mts',
    import: './dist/index.mjs',
    default: './dist/index.mjs',
  },
}

writeFileSync(
  packageJsonFilePath,
  `${JSON.stringify(packageJsonContent, null, 2)}\n`,
)

console.log('✓ Prepared package.json for publishing')
