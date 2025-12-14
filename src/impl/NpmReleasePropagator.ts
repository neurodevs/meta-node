import { exec as execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'

export default class NpmReleasePropagator implements ReleasePropagator {
    public static Class?: ReleasePropagatorConstructor
    public static exec = promisify(execSync)
    public static readFile = readFile

    private packageName: string
    private packageVersion: string
    private repoPaths: string[]

    private currentRepoPath!: string
    private currentPackageJson!: PackageJson

    protected constructor(options: ReleasePropagatorOptions) {
        const { packageName, packageVersion, repoPaths } = options

        this.packageName = packageName
        this.packageVersion = packageVersion
        this.repoPaths = repoPaths
    }

    public static Create(options: ReleasePropagatorOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        for (const repoPath of this.repoPaths) {
            this.currentRepoPath = repoPath

            await this.throwIfPreviousReleaseNotFound()
            await this.installReleaseForCurrentRepo()
        }
    }

    private async throwIfPreviousReleaseNotFound() {
        await this.loadCurrentPackageJson()

        if (!(this.isDependency || this.isDevDependency)) {
            throw new Error(
                `Cannot propagate release for ${this.packageName} because it is not listed in either dependencies or devDependencies! Please install it in the target repository before running propagation.`
            )
        }
    }

    private async loadCurrentPackageJson() {
        const raw = await this.readFile(this.currentPackageJsonPath, 'utf-8')
        this.currentPackageJson = JSON.parse(raw)
    }

    private get currentPackageJsonPath() {
        return `${this.currentRepoPath}/package.json`
    }

    private get isDependency() {
        return this.currentPackageJson?.dependencies?.[this.packageName]
    }

    private get isDevDependency() {
        return this.currentPackageJson?.devDependencies?.[this.packageName]
    }

    private async installReleaseForCurrentRepo() {
        await this.exec(
            `yarn add ${this.isDevDependency ? '-D ' : ''}${this.packageName}@${this.packageVersion}`,
            {
                cwd: this.currentRepoPath,
            }
        )
    }

    private get exec() {
        return NpmReleasePropagator.exec
    }

    private get readFile() {
        return NpmReleasePropagator.readFile
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
}

export interface PackageJson {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
}
