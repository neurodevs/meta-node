import { exec as execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { parse, minVersion, gte } from 'semver'

import GitAutocommit from './GitAutocommit.js'

export default class NpmReleasePropagator implements ReleasePropagator {
    public static Class?: ReleasePropagatorConstructor
    public static exec = promisify(execSync)
    public static readFile = readFile

    private packageName: string
    private packageVersion: string
    private repoPaths: string[]
    private shouldGitCommit: boolean

    private currentRepoPath!: string
    private currentPackageJson!: PackageJson
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

        for (const repoPath of this.repoPaths) {
            this.currentRepoPath = repoPath

            await this.loadCurrentPackageJson()

            this.throwIfPreviousReleaseNotFound()

            if (this.isUpToDate) {
                console.log(`Already up to date, skipping ${repoPath}...`)
                continue
            }

            console.log(`Propagating to ${repoPath}...`)
            await this.installReleaseForCurrentRepo()

            if (this.shouldGitCommit) {
                await this.gitCommitChanges()
            }
        }
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

    private async loadCurrentPackageJson() {
        const raw = await this.readFile(this.currentPackageJsonPath, 'utf-8')
        this.currentPackageJson = JSON.parse(raw)
    }

    private get currentPackageJsonPath() {
        return `${this.currentRepoPath}/package.json`
    }

    private throwIfPreviousReleaseNotFound() {
        if (!(this.dependencyRange || this.devDependencyRange)) {
            throw new Error(
                `Cannot propagate release for ${this.packageName} because it is not listed in either dependencies or devDependencies! Please install it in the target repository before running propagation.`
            )
        }
    }

    private get dependencyRange() {
        return this.currentPackageJson?.dependencies?.[this.packageName] ?? ''
    }

    private get devDependencyRange() {
        return (
            this.currentPackageJson?.devDependencies?.[this.packageName] ?? ''
        )
    }

    private get isUpToDate() {
        const target = parse(this.packageVersion)

        if (!target) {
            return false
        }

        const depMin = minVersion(this.dependencyRange ?? '')
        const devDepMin = minVersion(this.devDependencyRange ?? '')

        return (
            (depMin && gte(depMin, target)) ||
            (devDepMin && gte(devDepMin, target))
        )
    }

    private async installReleaseForCurrentRepo() {
        await this.exec(
            `yarn add ${this.devDependencyRange ? '-D ' : ''}${this.packageName}@${this.packageVersion}`,
            {
                cwd: this.currentRepoPath,
            }
        )
    }

    private async gitCommitChanges() {
        await this.setCurrentMetaNodeVersion()

        await this.GitAutocommit(
            `patch: propagate ${this.packageName}@${this.packageVersion} (@neurodevs/meta-node: ${this.metaNodeVersion})`
        )
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

    private get exec() {
        return NpmReleasePropagator.exec
    }

    private get readFile() {
        return NpmReleasePropagator.readFile
    }

    private GitAutocommit(commitMessage: string) {
        return GitAutocommit.Create(commitMessage, this.currentRepoPath)
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
