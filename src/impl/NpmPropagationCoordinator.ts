import { readFile } from 'node:fs/promises'

import semver from 'semver'

import NpmReleasePropagator, {
    PackageJson,
    ReleasePropagatorOptions,
} from './NpmReleasePropagator.js'

export default class NpmPropagationCoordinator
    implements PropagationCoordinator
{
    public static Class?: PropagationCoordinatorConstructor
    public static readFile = readFile

    private repoPath: string
    private repoPaths: string[]
    private shouldPropagateMajors: boolean

    private pkg!: PackageJson
    private currentRepoPath!: string
    private currentPkgJson!: PackageJson

    protected constructor(
        repoPath: string,
        repoPaths: string[],
        options?: PropagationCoordinatorOptions
    ) {
        const { shouldPropagateMajors = false } = options ?? {}

        this.repoPath = repoPath
        this.repoPaths = repoPaths
        this.shouldPropagateMajors = shouldPropagateMajors
    }

    public static Create(
        repoPath: string,
        repoPaths: string[],
        options?: PropagationCoordinatorOptions
    ) {
        return new (this.Class ?? this)(repoPath, repoPaths, options)
    }

    public async run() {
        await this.loadPackageJson()

        const repoPaths = await this.determineWhereToPropagate()

        const propagator = this.NpmReleaseCoordinator({
            packageName: this.packageName,
            packageVersion: this.packageVersion,
            repoPaths,
        })

        await propagator.run()
    }

    private async loadPackageJson() {
        const pkgJson = await this.readFile(
            `${this.repoPath}/package.json`,
            'utf-8'
        )
        this.pkg = JSON.parse(pkgJson)
    }

    private get packageName() {
        return this.pkg.name
    }

    private get packageVersion() {
        return this.pkg.version
    }

    private async determineWhereToPropagate() {
        const repoPaths: string[] = []

        const target = semver.parse(this.packageVersion)

        for (const repoPath of this.repoPaths) {
            this.currentRepoPath = repoPath
            this.currentPkgJson = await this.loadCurrentPkgJson()

            const min = semver.minVersion(this.maybeDependencyRange)

            if (!min || min.toString() === '0.0.0') {
                continue
            }

            if (this.shouldPropagateMajors || min?.major === target?.major) {
                repoPaths.push(repoPath)
            }
        }
        return repoPaths
    }

    private get maybeDependencyRange() {
        return (
            this.currentPkgJson?.dependencies?.[this.packageName] ??
            this.currentPkgJson?.devDependencies?.[this.packageName] ??
            ''
        )
    }

    private async loadCurrentPkgJson() {
        const pkgJson = await this.readFile(
            `${this.currentRepoPath}/package.json`,
            'utf-8'
        )
        return JSON.parse(pkgJson)
    }

    private get readFile() {
        return NpmPropagationCoordinator.readFile
    }

    private NpmReleaseCoordinator(options: ReleasePropagatorOptions) {
        return NpmReleasePropagator.Create(options)
    }
}

export interface PropagationCoordinator {
    run(): Promise<void>
}

export type PropagationCoordinatorConstructor = new (
    repoPath: string,
    repoPaths: string[],
    options?: PropagationCoordinatorOptions
) => PropagationCoordinator

export interface PropagationCoordinatorOptions {
    shouldPropagateMajors?: boolean
}
