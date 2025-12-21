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
        console.info('Starting type checking... \n')
        const repoNames = await this.readDir(this.workspacePath, {
            withFileTypes: true,
        })

        for (const repoName of repoNames) {
            if (!repoName.isDirectory()) {
                continue
            }

            const fullRepoPath = `${this.workspacePath}/${repoName.name}`

            const repoContents = await this.readDir(fullRepoPath)

            if (!repoContents.includes('tsconfig.json')) {
                continue
            }

            console.info(`Checking types for ${fullRepoPath}...`)

            try {
                await this.exec('npx tsc --noEmit', { cwd: fullRepoPath })
            } catch {
                console.error(`Type errors found in ${fullRepoPath}!`)
            }
        }

        console.info('\n Type checking completed! \n')
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
