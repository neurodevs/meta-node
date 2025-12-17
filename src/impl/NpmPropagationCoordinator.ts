import { readFile } from 'node:fs/promises'

import NpmReleasePropagator, {
    PackageJson,
    ReleasePropagatorOptions,
} from './NpmReleasePropagator.js'

export default class NpmPropagationCoordinator implements PropagationCoordinator {
    public static Class?: PropagationCoordinatorConstructor
    public static readFile = readFile

    private repoPath: string
    private repoPaths: string[]

    private currentRepoPath!: string
    private currentPkgJson!: PackageJson

    protected constructor(repoPath: string, repoPaths: string[]) {
        this.repoPath = repoPath
        this.repoPaths = repoPaths
    }

    public static Create(repoPath: string, repoPaths: string[]) {
        return new (this.Class ?? this)(repoPath, repoPaths)
    }

    public async run() {
        const packageName = this.repoPath.split('/').pop()!
        const packageVersion = await this.getPackageVersion()
        const repoPaths = await this.determineWhereToPropagate()

        const propagator = this.NpmReleaseCoordinator({
            packageName,
            packageVersion,
            repoPaths,
        })

        await propagator.run()
    }

    private async getPackageVersion() {
        const pkgJson = await this.readFile(
            `${this.repoPath}/package.json`,
            'utf-8'
        )
        return JSON.parse(pkgJson)?.version as string
    }

    private async determineWhereToPropagate() {
        const repoPaths: string[] = []

        for (const repoPath of this.repoPaths) {
            this.currentRepoPath = repoPath
            this.currentPkgJson = await this.loadCurrentPkgJson()

            if (this.isDependency ?? this.isDevDependency) {
                repoPaths.push(repoPath)
            }
        }
        return repoPaths
    }

    private get isDependency() {
        return this.currentPkgJson?.dependencies?.[this.repoPath]
    }

    private get isDevDependency() {
        return this.currentPkgJson?.devDependencies?.[this.repoPath]
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
    repoPaths: string[]
) => PropagationCoordinator
