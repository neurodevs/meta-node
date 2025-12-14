import { exec as execSync } from 'node:child_process'
import { promisify } from 'node:util'
import {
    callsToExec,
    fakeExec,
    resetCallsToExec,
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

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeExec()

        this.instance = this.NpmReleasePropagator()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async installsReleaseForEachRepoPath() {
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

    private static async run() {
        await this.instance.run()
    }

    private static setFakeExec() {
        NpmReleasePropagator.exec = fakeExec as unknown as typeof exec
        resetCallsToExec()
    }

    private static readonly packageName = this.generateId()
    private static readonly packageVersion = this.generateId()
    private static readonly repoPaths = [this.generateId(), this.generateId()]

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
