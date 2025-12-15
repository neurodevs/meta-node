import { exec as execSync } from 'node:child_process'
import { promisify } from 'node:util'

export default class GitAutocommit implements Autocommit {
    public static Class?: AutocommitConstructor
    public static exec = promisify(execSync)

    private commitMessage: string
    private cwd?: string

    protected constructor(commitMessage: string, cwd?: string) {
        this.commitMessage = commitMessage
        this.cwd = cwd
    }

    public static async Create(commitMessage: string, cwd?: string) {
        const instance = new (this.Class ?? this)(commitMessage, cwd)
        await instance.run()

        return instance
    }

    public async run() {
        const execOptions = { cwd: this.cwd ?? process.cwd() }

        await this.exec('git add .', execOptions)
        await this.exec(`git commit -m "${this.commitMessage}"`, execOptions)
        await this.exec('git push', execOptions)
    }

    private get exec() {
        return GitAutocommit.exec
    }
}

export interface Autocommit {
    run(): Promise<void>
}

export type AutocommitConstructor = new (commitMessage: string) => Autocommit
