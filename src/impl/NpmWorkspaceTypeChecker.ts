import { exec as execSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { promisify } from 'node:util'

export default class NpmWorkspaceTypeChecker implements WorkspaceTypeChecker {
    public static Class?: WorkspaceTypeCheckerConstructor
    public static readDir = readdir
    public static exec = promisify(execSync)

    private workspacePath: string

    protected constructor(workspacePath: string) {
        this.workspacePath = workspacePath
    }

    public static Create(workspacePath: string) {
        return new (this.Class ?? this)(workspacePath)
    }

    public async run() {
        console.info('Starting type checking...\n')
        const repoNames = await this.readDir(this.workspacePath)

        for (const repoName of repoNames) {
            const fullRepoPath = `${this.workspacePath}/${repoName}`
            console.info(`Checking types for ${fullRepoPath}...`)

            try {
                await this.exec('npx tsc --noEmit', { cwd: fullRepoPath })
            } catch {
                console.error(`Type errors found in ${fullRepoPath}!`)
            }
        }
    }

    private get readDir() {
        return NpmWorkspaceTypeChecker.readDir
    }
    private get exec() {
        return NpmWorkspaceTypeChecker.exec
    }
}

export interface WorkspaceTypeChecker {
    run(): Promise<void>
}

export type WorkspaceTypeCheckerConstructor = new (
    workspacePath: string
) => WorkspaceTypeChecker
