import { exec as execSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
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
        const repoNames = await this.readDir(this.workspacePath, {
            withFileTypes: true,
        })

        const repoPaths = (
            await Promise.all(
                repoNames.map(async (repoName) => {
                    if (!repoName.isDirectory()) {
                        return
                    }

                    const repoPath = join(this.workspacePath, repoName.name)
                    const repoContents = await this.readDir(repoPath)

                    if (!repoContents.includes('tsconfig.json')) {
                        return
                    }
                    return repoPath
                })
            )
        ).filter((p): p is string => Boolean(p))

        console.info(
            `\nChecking types for the following repos:\n\n${repoPaths
                .map((r) => `  ${r}`)
                .join('\n')}\n`
        )

        await Promise.all(
            repoPaths.map(async (repoPath) => {
                try {
                    await this.exec('npx tsc --noEmit', { cwd: repoPath })
                } catch {
                    console.error(`Type errors found in ${repoPath}!`)
                }
            })
        )

        console.info('\nType checking completed!\n')
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
