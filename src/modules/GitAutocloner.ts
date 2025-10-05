import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { chdir } from 'process'

export default class GitAutocloner implements Autocloner {
    public static Class?: AutoclonerConstructor
    public static execSync = execSync
    public static existsSync = existsSync

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

        this.throwIfDirPathDoesNotExist()
        this.changeDirectoryToDirPath()
        this.cloneReposFromUrls()
    }

    private throwIfDirPathDoesNotExist() {
        if (!this.dirPathExists) {
            this.throwDirPathDoesNotExist()
        }
    }

    private get dirPathExists() {
        return this.existsSync(this.dirPath)
    }

    private throwDirPathDoesNotExist() {
        throw new Error(`dirPath does not exist: ${this.dirPath}!`)
    }

    private changeDirectoryToDirPath() {
        chdir(this.dirPath)
    }

    private cloneReposFromUrls() {
        this.urls.forEach((url) => {
            this.currentUrl = url
            this.cloneCurrentUrl()
        })
    }

    private cloneCurrentUrl() {
        if (!this.currentRepoExists) {
            this.tryToCloneRepo()
        } else {
            this.log.info(`Repo exists, skipping: ${this.currentRepoName}!`)
        }
    }

    private get currentRepoExists() {
        return this.existsSync(this.currentRepoName)
    }

    private get currentRepoName() {
        return this.currentUrl.match(this.regexForRepoName)![1]
    }

    private readonly regexForRepoName = /\/([a-zA-Z0-9_.-]+)\.git/

    private tryToCloneRepo() {
        try {
            this.execSync(`git clone ${this.currentUrl}`)
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

    private get existsSync() {
        return GitAutocloner.existsSync
    }

    private get execSync() {
        return GitAutocloner.execSync
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
