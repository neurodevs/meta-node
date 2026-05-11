import { exec as execSync } from 'child_process'
import { promisify } from 'util'
import { pathExists } from 'fs-extra'

export default class GitAutocloner implements Autocloner {
    public static Class?: AutoclonerConstructor
    public static exec = promisify(execSync)
    public static pathExists = pathExists

    private urls!: string[]
    protected cwd?: string
    private currentUrl!: string
    private currentError!: any
    private log = console

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async run(options: AutoclonerOptions) {
        const { urls, cwd } = options

        this.urls = urls
        this.cwd = cwd ?? process.cwd()

        await this.runForEachUrl()
    }

    private async runForEachUrl() {
        this.log.info(`Running GitAutocloner for ${this.urls.length} repos...`)

        for (const url of this.urls) {
            this.currentUrl = url
            await this.runCurrentUrl()
        }
    }

    private async runCurrentUrl() {
        const currentRepoExists = await this.checkIfCurrentRepoExists()

        if (!currentRepoExists) {
            this.log.info(`\tCloning repo: ${this.currentUrl}...`)
            await this.tryToCloneRepo()
            await this.runYarnInstall()
        } else {
            this.log.info(`\tRepo exists, pulling: ${this.currentRepoName}...`)
            const { stdout } = await this.runGitPull()

            if (!stdout.includes('Already up to date')) {
                this.log.info('\t\tChanges were pulled...')
                await this.runYarnInstall()
            }
        }
    }

    private async checkIfCurrentRepoExists() {
        return this.pathExists(this.currentRepoName)
    }

    private get currentRepoName() {
        return this.currentUrl.match(this.regexForRepoName)![1]
    }

    private readonly regexForRepoName = /\/([a-zA-Z0-9_.-]+)\.git/

    private async tryToCloneRepo() {
        try {
            await this.exec(`git clone ${this.currentUrl}`, { cwd: this.cwd })
        } catch (err: any) {
            this.currentError = err
            this.throwGitCloneFailed()
        }
    }

    private throwGitCloneFailed() {
        throw new Error(this.gitCloneFailedMessage)
    }

    private get gitCloneFailedMessage() {
        return `Git clone failed for repo: ${this.currentUrl}!\n\n${this.currentError}\n\n`
    }

    private async runYarnInstall() {
        this.log.info('\t\tRunning yarn install...')
        await this.exec(`yarn --cwd ./${this.currentRepoName} install`, {
            cwd: this.cwd,
        })
    }

    private async runGitPull() {
        return await this.exec(`git -C ./${this.currentRepoName} pull`, {
            cwd: this.cwd,
        })
    }

    private get exec() {
        return GitAutocloner.exec
    }

    private get pathExists() {
        return GitAutocloner.pathExists
    }
}

export interface Autocloner {
    run(options: AutoclonerOptions): Promise<void>
}

export type AutoclonerConstructor = new () => Autocloner

export interface AutoclonerOptions {
    urls: string[]
    cwd?: string
}
