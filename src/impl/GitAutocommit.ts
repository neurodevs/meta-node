import { exec as execSync } from 'node:child_process'
import { promisify } from 'node:util'

export default class GitAutocommit implements Autocommit {
    public static Class?: AutocommitConstructor
    public static exec = promisify(execSync)

    private commitMessage: string

    protected constructor(commitMessage: string) {
        this.commitMessage = commitMessage
    }

    public static async Create(commitMessage: string) {
        const instance = new (this.Class ?? this)(commitMessage)
        await instance.run()

        return instance
    }

    public async run() {
        await this.exec('git add .')
        await this.exec(`git commit -m "${this.commitMessage}"`)
        await this.exec('git push')
    }

    private get exec() {
        return GitAutocommit.exec
    }
}

export interface Autocommit {
    run(): Promise<void>
}

export type AutocommitConstructor = new (commitMessage: string) => Autocommit
