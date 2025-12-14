import { exec as execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import {
    callsToExec,
    fakeExec,
    fakeReadFile,
    resetCallsToExec,
    resetCallsToReadFile,
    setFakeReadFileResult,
} from '@neurodevs/fake-node-core'
import { test, assert } from '@neurodevs/node-tdd'

import NpmReleasePropagator, {
    ReleasePropagator,
    ReleasePropagatorOptions,
} from '../../impl/NpmReleasePropagator.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

const exec = promisify(execSync)

export default class NpmReleasePropagatorTest extends AbstractPackageTest {
    private static instance: ReleasePropagator

    private static readonly packageName = this.generateId()
    private static readonly packageVersion = this.generateId()
    private static readonly repoPaths = [this.generateId(), this.generateId()]

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeExec()
        this.setFakeReadFile()

        this.instance = this.NpmReleasePropagator()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async runInstallsReleaseForEachRepoPath() {
        await this.run()

        const expectedCalls = this.repoPaths.map((repoPath) => ({
            command: `yarn add ${this.packageName}@${this.packageVersion}`,
            options: { cwd: repoPath },
        }))

        assert.isEqualDeep(
            callsToExec,
            expectedCalls,
            'Did not install release in each repo path!'
        )
    }

    @test()
    protected static async runThrowsIfRepoDoesNotHavePreviousRelease() {
        const missingPackageName = this.generateId()

        this.instance = this.NpmReleasePropagator({
            packageName: missingPackageName,
        })

        await assert.doesThrowAsync(async () => {
            await this.run()
        }, `Cannot propagate release for ${missingPackageName} because it is not listed in either dependencies or devDependencies! Please install it in the target repository before running propagation.`)
    }

    private static async run() {
        await this.instance.run()
    }

    private static setFakeExec() {
        NpmReleasePropagator.exec = fakeExec as unknown as typeof exec
        resetCallsToExec()
    }

    private static setFakeReadFile() {
        NpmReleasePropagator.readFile =
            fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()

        setFakeReadFileResult(
            `${this.repoPaths[0]}/package.json`,
            JSON.stringify({
                dependencies: {
                    [this.packageName]: this.generateId(),
                },
            })
        )

        setFakeReadFileResult(
            `${this.repoPaths[1]}/package.json`,
            JSON.stringify({
                devDependencies: {
                    [this.packageName]: this.generateId(),
                },
            })
        )
    }

    private static NpmReleasePropagator(
        options?: Partial<ReleasePropagatorOptions>
    ) {
        return NpmReleasePropagator.Create({
            packageName: this.packageName,
            packageVersion: this.packageVersion,
            repoPaths: this.repoPaths,
            ...options,
        })
    }
}
