import { exec as execSync } from 'child_process'
import { promisify } from 'util'
import { test, assert } from '@sprucelabs/test-utils'
import {
    callsToChdir,
    callsToExec,
    fakeChdir,
    fakeExec,
    fakePathExists,
    resetCallsToChdir,
    resetCallsToExec,
    setPathShouldExist,
} from '@neurodevs/fake-node-core'
import generateId from '@neurodevs/generate-id'
import { pathExists } from 'fs-extra'
import GitAutocloner, {
    Autocloner,
    AutoclonerOptions,
} from '../../impl/GitAutocloner'
import AbstractPackageTest from '../AbstractPackageTest'

const exec = promisify(execSync)

export default class AutoclonerTest extends AbstractPackageTest {
    private static instance: Autocloner

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeChdir()
        this.setFakeExec()
        this.setFakePathExists()

        this.instance = this.GitAutocloner()
    }

    @test()
    protected static async canCreateAutocloner() {
        assert.isTruthy(this.instance, 'Should create a new instance!')
    }

    @test()
    protected static async throwsIfDirPathDoesNotExist() {
        const err = await assert.doesThrowAsync(() =>
            this.run({ dirPath: this.invalidDirPath })
        )

        assert.isEqual(
            err.message,
            `dirPath does not exist: ${this.invalidDirPath}!`,
            'Did not receive the expected error!'
        )
    }

    @test()
    protected static async changesCurrentDirectoryToDirPath() {
        await this.run()

        assert.isEqual(
            callsToChdir[0],
            this.validDirPath,
            'Should change current directory to the dirPath!'
        )
    }

    @test()
    protected static async callsGitCloneForEachUrl() {
        await this.run()

        this.urls.forEach((url) => {
            assert.doesInclude(callsToExec, `git clone ${url}`)
        })
    }

    @test()
    protected static async doesNotCallGitCloneIfUrlExists() {
        await this.run()

        this.urls.forEach((url) => {
            setPathShouldExist(url.match(this.regexForRepoName)![1], true)
        })

        resetCallsToExec()

        await this.run()

        assert.isLength(callsToExec, 0)
    }

    @test()
    protected static async throwsIfGitCloneFails() {
        GitAutocloner.exec = (_command: string) => {
            throw new Error(this.gitCloneFailedError)
        }

        const err = await assert.doesThrowAsync(() => this.run())

        assert.isEqual(
            this.normalize(err.message),
            this.normalize(this.gitCloneFailedMessage),
            'Did not receive the expected error!'
        )
    }

    @test()
    protected static async worksWithPeriodInRepoName() {
        const repoName = `/${generateId()}.${generateId()}.git`
        await this.run({ urls: [repoName] })
    }

    private static run(options?: Partial<AutoclonerOptions>) {
        return this.instance.run({
            urls: this.urls,
            dirPath: this.validDirPath,
            ...options,
        })
    }

    private static setFakeChdir() {
        GitAutocloner.chdir = fakeChdir
        resetCallsToChdir()
    }

    private static setFakeExec() {
        GitAutocloner.exec = fakeExec as unknown as typeof exec
        resetCallsToExec()
    }

    private static setFakePathExists() {
        GitAutocloner.pathExists =
            fakePathExists as unknown as typeof pathExists
        resetCallsToExec()

        setPathShouldExist(this.validDirPath, true)

        this.urls.forEach((url) => {
            setPathShouldExist(url.match(this.regexForRepoName)![1], false)
        })
    }

    private static generateUrl() {
        return `https://github.com/${generateId()}.git`
    }

    private static get gitCloneFailedMessage() {
        return `Git clone failed for repo: ${this.urls[0]}! Error: \n\n${this.gitCloneFailedError}\n\n`
    }

    private static readonly urls = [this.generateUrl(), this.generateUrl()]
    private static readonly validDirPath = generateId()
    private static readonly invalidDirPath = generateId()
    private static readonly gitCloneFailedError = 'Failed to clone repo!'
    private static readonly regexForRepoName = /\/([a-zA-Z0-9_.-]+)\.git/

    private static GitAutocloner() {
        return GitAutocloner.Create()
    }
}
