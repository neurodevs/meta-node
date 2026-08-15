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
    public static log = console

    private readonly defaultConcurrency = 4

    private packageName: string
    private packageVersion: string
    private repoPaths: string[]
    private shouldGitCommit: boolean
    private concurrency: number

    private metaNodeVersion!: string
    private reposWithTypeErrors: string[] = []
    private failures: PropagationFailure[] = []

    protected constructor(options: ReleasePropagatorOptions) {
        const {
            packageName,
            packageVersion,
            repoPaths,
            shouldGitCommit = true,
            concurrency,
        } = options

        this.packageName = packageName
        this.packageVersion = packageVersion
        this.repoPaths = repoPaths
        this.shouldGitCommit = shouldGitCommit
        this.concurrency = concurrency ?? this.defaultConcurrency
    }

    public static Create(options: ReleasePropagatorOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        await this.throwIfUncommittedGitChanges()
        await this.throwIfMissingPreviousRelease()
        await this.setCurrentMetaNodeVersion()

        this.log.info('Starting propagation...\n')

        this.reposWithTypeErrors = []
        this.failures = []

        await this.runWithBoundedConcurrency()

        this.logReposWithTypeErrors()
        this.logReposThatFailed()

        this.log.info('\nPropagation complete!\n')
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

    private async throwIfMissingPreviousRelease() {
        for (const repoPath of this.repoPaths) {
            const pkg = await this.loadPackageJsonFor(repoPath)
            this.throwIfNoPreviousReleaseFor(pkg)
        }
    }

    private async loadPackageJsonFor(repoPath: string) {
        const raw = await this.readFile(`${repoPath}/package.json`, 'utf-8')
        return JSON.parse(raw)
    }

    private throwIfNoPreviousReleaseFor(pkg: PackageJson) {
        const { dependencies, devDependencies } = pkg

        const isDependency = Boolean(dependencies?.[this.packageName])
        const isDevDependency = Boolean(devDependencies?.[this.packageName])

        if (!(isDependency || isDevDependency)) {
            throw new Error(
                `Cannot propagate release for ${this.packageName} because it is not listed in either dependencies or devDependencies! Please install it in the target repository before running propagation.`
            )
        }
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

    private async runWithBoundedConcurrency() {
        const queue = [...this.repoPaths]
        const numWorkers = Math.min(this.concurrency, queue.length)

        await Promise.all(
            Array.from({ length: numWorkers }, () =>
                this.runUntilQueueIsEmpty(queue)
            )
        )
    }

    private async runUntilQueueIsEmpty(queue: string[]) {
        while (queue.length > 0) {
            const repoPath = queue.shift()!
            await this.tryRunFor(repoPath)
        }
    }

    private async tryRunFor(repoPath: string) {
        try {
            await this.runFor(repoPath)
        } catch (err) {
            this.failures.push({
                repoPath,
                message: (err as Error).message,
            })
        }
    }

    private async runFor(repoPath: string) {
        const pkg = await this.loadPackageJsonFor(repoPath)

        const isUpToDate = this.isUpToDateFor(pkg)

        if (isUpToDate) {
            this.log.info(`Already up to date, skipping ${repoPath}...`)
            return
        }

        this.log.info(`Propagating to ${repoPath}...`)
        await this.installReleaseFor(repoPath, pkg)

        const hasTypeErrors = await this.checkTypeErrorsFor(repoPath)

        if (hasTypeErrors) {
            this.log.warn(`Rolling back ${repoPath} due to type errors...`)
            this.reposWithTypeErrors.push(repoPath)
            await this.rollbackInstallationFor(repoPath)
            return
        }

        if (this.shouldGitCommit) {
            await this.gitCommitChangesFor(repoPath)
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

    private logReposWithTypeErrors() {
        if (this.reposWithTypeErrors.length === 0) {
            return
        }

        this.log.error(
            `\nType errors detected in the following repositor${this.reposWithTypeErrors.length > 1 ? 'ies' : 'y'}, so their changes were rolled back:\n\n\t - ${this.reposWithTypeErrors.join('\n\t - ')}\n`
        )
    }

    private logReposThatFailed() {
        if (this.failures.length === 0) {
            return
        }

        const details = this.failures.map(
            ({ repoPath, message }) => `${repoPath}: ${message}`
        )

        this.log.error(
            `\nFailed to propagate to the following repositor${this.failures.length > 1 ? 'ies' : 'y'}:\n\n\t - ${details.join('\n\t - ')}\n`
        )
    }

    private get exec() {
        return NpmReleasePropagator.exec
    }

    private get readFile() {
        return NpmReleasePropagator.readFile
    }

    private get log() {
        return NpmReleasePropagator.log
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
    concurrency?: number
}

export interface PropagationFailure {
    repoPath: string
    message: string
}

export interface PackageJson {
    name: string
    version: string
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
}
