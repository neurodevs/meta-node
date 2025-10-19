import { exec as execSync } from 'child_process'
import { chdir } from 'process'
import { promisify } from 'util'
import { pathExists } from 'fs-extra'

export default class GitAutocloner implements Autocloner {
    public static Class?: AutoclonerConstructor
    public static chdir = chdir
    public static exec = promisify(execSync)
    public static pathExists = pathExists

    private urls!: string[]
    private dirPath!: string
    private currentUrl!: string
    private currentError!: any
    private log = console

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async run(options: AutoclonerOptions) {
        const { urls, dirPath } = options

        this.urls = urls
        this.dirPath = dirPath

        await this.throwIfDirPathDoesNotExist()

        this.changeDirectoryToDirPath()
        await this.cloneReposFromUrls()
    }

    private async throwIfDirPathDoesNotExist() {
        const dirPathExists = await this.checkIfDirPathExists()

        if (!dirPathExists) {
            this.throwDirPathDoesNotExist()
        }
    }

    private async checkIfDirPathExists() {
        return this.pathExists(this.dirPath)
    }

    private throwDirPathDoesNotExist() {
        throw new Error(`dirPath does not exist: ${this.dirPath}!`)
    }

    private changeDirectoryToDirPath() {
        this.chdir(this.dirPath)
    }

    private async cloneReposFromUrls() {
        for (const url of this.urls) {
            this.currentUrl = url
            await this.cloneCurrentUrl()
        }
    }

    private async cloneCurrentUrl() {
        const currentRepoExists = await this.checkIfCurrentRepoExists()

        if (!currentRepoExists) {
            await this.tryToCloneRepo()
        } else {
            this.log.info(`Repo exists, skipping: ${this.currentRepoName}!`)
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
            await this.exec(`git clone ${this.currentUrl}`)
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

    private get chdir() {
        return GitAutocloner.chdir
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
    dirPath: string
}
