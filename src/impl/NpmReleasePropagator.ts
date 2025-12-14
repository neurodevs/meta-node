import { exec as execSync } from 'node:child_process'
import { promisify } from 'node:util'

export default class NpmReleasePropagator implements ReleasePropagator {
    public static Class?: ReleasePropagatorConstructor
    public static exec = promisify(execSync)

    private packageName: string
    private packageVersion: string
    private repoPaths: string[]

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
            await this.installReleaseFor(repoPath)
        }
    }

    private async installReleaseFor(repoPath: string) {
        await this.exec(`yarn add ${this.packageName}@${this.packageVersion}`, {
            cwd: repoPath,
        })
    }

    private get exec() {
        return NpmReleasePropagator.exec
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
