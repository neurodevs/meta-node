import { ChildProcess, exec as execSync } from 'child_process'
import { promisify } from 'util'
import {
    callsToChdir,
    callsToExec,
    fakeChdir,
    fakeExec,
    fakePathExists,
    resetCallsToChdir,
    resetCallsToExec,
    setFakeExecResult,
    setPathShouldExist,
} from '@neurodevs/fake-node-core'
import { test, assert } from '@neurodevs/node-tdd'
import { pathExists } from 'fs-extra'

import GitAutocloner, {
    Autocloner,
    AutoclonerOptions,
} from '../../impl/GitAutocloner.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

const exec = promisify(execSync)

export default class AutoclonerTest extends AbstractPackageTest {
    private static instance: Autocloner

    private static packageNameA = this.generateId()
    private static packageNameB = this.generateId()

    private static urlA = this.generateUrl(this.packageNameA)
    private static urlB = this.generateUrl(this.packageNameB)

    private static generateUrl(packageName: string) {
        return `https://github.com/${packageName}.git`
    }

    private static readonly urls = [this.urlA, this.urlB]

    private static get gitPullPackageA() {
        return `git -C ./${this.packageNameA} pull`
    }

    private static get gitPullPackageB() {
        return `git -C ./${this.packageNameB} pull`
    }

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
        this.setUrlsShouldExist()
        resetCallsToExec()

        await this.run()

        assert.isLength(
            callsToExec.filter((call) => call.startsWith('git clone')),
            0
        )
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
        const repoName = `/${this.generateId()}.${this.generateId()}.git`
        await this.run({ urls: [repoName] })
    }

    @test()
    protected static async callsYarnInstallAfterCloningFirstRepo() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[1],
            `yarn --cwd ./${this.packageNameA} install`,
            'Should call yarn install after cloning first package!'
        )
    }

    @test()
    protected static async callsYarnInstallAfterCloningSecondRepo() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[3],
            `yarn --cwd ./${this.packageNameB} install`,
            'Should call yarn install after cloning second package!'
        )
    }

    @test()
    protected static async callsGitPullIfFirstRepoExists() {
        await this.setUrlsShouldExistAndRun()

        assert.isEqualDeep(
            callsToExec[0],
            this.gitPullPackageA,
            'Should call git pull if first repo exists!'
        )
    }

    @test()
    protected static async callsGitPullIfSecondRepoExists() {
        await this.setUrlsShouldExistAndRun()

        assert.isEqualDeep(
            callsToExec[2],
            this.gitPullPackageB,
            'Should call git pull if second repo exists!'
        )
    }

    @test()
    protected static async callsYarnInstallIfFirstChangesWerePulled() {
        this.fakeGitPullChanges()
        await this.setUrlsShouldExistAndRun()

        assert.isEqualDeep(
            callsToExec[1],
            `yarn --cwd ./${this.packageNameA} install`,
            'Should call yarn install after pulling first package!'
        )
    }

    @test()
    protected static async callsYarnInstallIfSecondChangesWerePulled() {
        this.fakeGitPullChanges()
        await this.setUrlsShouldExistAndRun()

        assert.isEqualDeep(
            callsToExec[3],
            `yarn --cwd ./${this.packageNameB} install`,
            'Should call yarn install after pulling second package!'
        )
    }

    @test()
    protected static async doesNotCallYarnInstallIfNoChangesPulled() {
        this.fakeGitPullUpToDate()
        await this.setUrlsShouldExistAndRun()

        assert.isLength(
            callsToExec.filter((call) => call.startsWith('yarn --cwd ./')),
            0,
            'Should not call yarn install if no changes were pulled!'
        )
    }

    private static run(options?: Partial<AutoclonerOptions>) {
        return this.instance.run({
            urls: this.urls,
            dirPath: this.validDirPath,
            ...options,
        })
    }

    private static async setUrlsShouldExistAndRun() {
        this.setUrlsShouldExist()
        resetCallsToExec()

        await this.run()
    }

    private static setUrlsShouldExist() {
        this.urls.forEach((url) => {
            setPathShouldExist(url.match(this.regexForRepoName)![1], true)
        })
    }

    private static fakeGitPullChanges() {
        const fakeResult = {
            stdout: this.generateId(),
        } as unknown as ChildProcess

        setFakeExecResult(this.gitPullPackageA, fakeResult)
        setFakeExecResult(this.gitPullPackageB, fakeResult)
    }

    private static fakeGitPullUpToDate() {
        const fakeResult = {
            stdout: 'Already up to date.',
        } as unknown as ChildProcess

        setFakeExecResult(this.gitPullPackageA, fakeResult)
        setFakeExecResult(this.gitPullPackageB, fakeResult)
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

    private static get gitCloneFailedMessage() {
        return `Git clone failed for repo: ${this.urls[0]}! Error: \n\n${this.gitCloneFailedError}\n\n`
    }

    private static readonly validDirPath = this.generateId()
    private static readonly invalidDirPath = this.generateId()
    private static readonly gitCloneFailedError = 'Failed to clone repo!'
    private static readonly regexForRepoName = /\/([a-zA-Z0-9_.-]+)\.git/

    private static GitAutocloner() {
        return GitAutocloner.Create()
    }
}
