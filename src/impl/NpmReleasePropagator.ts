import { exec as execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import semver from 'semver'

import GitAutocommit from './GitAutocommit.js'

export default class NpmReleasePropagator implements ReleasePropagator {
    public static Class?: ReleasePropagatorConstructor
    public static exec = promisify(execSync)
    public static readFile = readFile

    private packageName: string
    private packageVersion: string
    private repoPaths: string[]
    private shouldGitCommit: boolean

    private metaNodeVersion!: string

    protected constructor(options: ReleasePropagatorOptions) {
        const {
            packageName,
            packageVersion,
            repoPaths,
            shouldGitCommit = true,
        } = options

        this.packageName = packageName
        this.packageVersion = packageVersion
        this.repoPaths = repoPaths
        this.shouldGitCommit = shouldGitCommit
    }

    public static Create(options: ReleasePropagatorOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        await this.throwIfUncommittedGitChanges()
        await this.setCurrentMetaNodeVersion()

        console.info('Starting propagation...\n')

        await Promise.all(
            this.repoPaths.map((repoPath) => this.runFor(repoPath))
        )

        console.info('\nPropagation complete!\n')
    }

    private async throwIfUncommittedGitChanges() {
        const repoPathsWithChanges: string[] = []

        for (const repoPath of this.repoPaths) {
            const changes = await this.exec('git status --porcelain', {
                cwd: repoPath,
            })

            if (changes.stdout.trim().length > 0) {
                repoPathsWithChanges.push(repoPath)
            }
        }

        if (repoPathsWithChanges.length > 0) {
            const err = this.generateUncommittedErrorFrom(repoPathsWithChanges)
            throw new Error(err)
        }
    }

    private generateUncommittedErrorFrom(repoPathsWithChanges: string[]) {
        return `Cannot propagate release because there are uncommitted git changes in the following repositor${repoPathsWithChanges.length > 1 ? 'ies' : 'y'}:

\t - ${repoPathsWithChanges.join('\n\t - ')}

Please commit or stash these changes before running propagation!
        `
    }

    private async setCurrentMetaNodeVersion() {
        const globalRoot = await this.exec('yarn global dir')

        const pkgPath = path.join(
            globalRoot.stdout.trim(),
            'node_modules',
            '@neurodevs',
            'meta-node',
            'package.json'
        )

        const raw = await this.readFile(pkgPath, { encoding: 'utf-8' })
        const pkg = JSON.parse(raw)

        this.metaNodeVersion = pkg.version
    }

    private async runFor(repoPath: string) {
        const pkg = await this.loadPackageJsonFor(repoPath)
        this.throwIfNoPreviousReleaseFor(pkg)

        const isUpToDate = this.isUpToDateFor(pkg)

        if (isUpToDate) {
            console.info(`Already up to date, skipping ${repoPath}...`)
            return
        }

        console.info(`Propagating to ${repoPath}...`)
        await this.installReleaseFor(repoPath, pkg)

        const hasTypeErrors = await this.checkTypeErrorsFor(repoPath)

        if (hasTypeErrors) {
            console.warn(`Type errors detected! Rolling back ${repoPath}...`)
            await this.rollbackInstallationFor(repoPath)
            return
        }

        if (this.shouldGitCommit) {
            await this.gitCommitChangesFor(repoPath)
        }
    }

    private async loadPackageJsonFor(repoPath: string) {
        const raw = await this.readFile(`${repoPath}/package.json`, 'utf-8')
        return JSON.parse(raw)
    }

    private throwIfNoPreviousReleaseFor(pkg: PackageJson) {
        const isDependency = Boolean(pkg.dependencies?.[this.packageName])
        const isDevDependency = Boolean(pkg.devDependencies?.[this.packageName])

        if (!(isDependency || isDevDependency)) {
            throw new Error(
                `Cannot propagate release for ${this.packageName} because it is not listed in either dependencies or devDependencies! Please install it in the target repository before running propagation.`
            )
        }
    }

    private isUpToDateFor(pkg: PackageJson) {
        const target = semver.parse(this.packageVersion)!

        const dependencyMin = semver.minVersion(
            pkg.dependencies?.[this.packageName] ?? ''
        )

        const devDependencyMin = semver.minVersion(
            pkg.devDependencies?.[this.packageName] ?? ''
        )

        return (
            (dependencyMin && semver.gte(dependencyMin, target)) ||
            (devDependencyMin && semver.gte(devDependencyMin, target))
        )
    }

    private async installReleaseFor(repoPath: string, pkg: PackageJson) {
        const isDevDependency = Boolean(pkg.devDependencies?.[this.packageName])

        await this.exec(
            `yarn add ${isDevDependency ? '-D ' : ''}${this.packageName}@${this.packageVersion}`,
            {
                cwd: repoPath,
            }
        )
    }

    private async checkTypeErrorsFor(repoPath: string) {
        try {
            await this.exec(`npx tsc --noEmit`, {
                cwd: repoPath,
            })
            return false
        } catch {
            return true
        }
    }

    private async rollbackInstallationFor(repoPath: string) {
        await this.exec(`git reset --hard && git clean -fd`, {
            cwd: repoPath,
        })
    }

    private async gitCommitChangesFor(repoPath: string) {
        await this.GitAutocommit(
            `patch: propagate ${this.packageName}@${this.packageVersion} (@neurodevs/meta-node: ${this.metaNodeVersion})`,
            repoPath
        )
    }

    private get exec() {
        return NpmReleasePropagator.exec
    }

    private get readFile() {
        return NpmReleasePropagator.readFile
    }

    private GitAutocommit(commitMessage: string, repoPath: string) {
        return GitAutocommit.Create(commitMessage, repoPath)
    }
}

export interface ReleasePropagator {
    run(): Promise<void>
}

export type ReleasePropagatorConstructor = new (
    options: ReleasePropagatorOptions
) => ReleasePropagator

export interface ReleasePropagatorOptions {
    packageName: string
    packageVersion: string
    repoPaths: string[]
    shouldGitCommit?: boolean
}

export interface PackageJson {
    name: string
    version: string
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
}
