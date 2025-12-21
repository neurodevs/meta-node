import { exec as execSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { promisify } from 'node:util'

import {
    callsToExec,
    fakeExec,
    fakeReadDir,
    resetCallsToExec,
    resetCallsToReadDir,
    setFakeReadDirResult,
} from '@neurodevs/fake-node-core'
import { test, assert } from '@neurodevs/node-tdd'

const exec = promisify(execSync)

import NpmWorkspaceTypeChecker, {
    WorkspaceTypeChecker,
} from '../../impl/NpmWorkspaceTypeChecker.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class NpmWorkspaceTypeCheckerTest extends AbstractPackageTest {
    private static instance: WorkspaceTypeChecker

    private static readonly workspacePath = this.generateId()

    private static readonly repoName1 = this.generateId()
    private static readonly repoName2 = this.generateId()

    private static readonly repoPaths = [
        `${this.workspacePath}/${this.repoName1}`,
        `${this.workspacePath}/${this.repoName2}`,
    ]

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeReadDir()
        this.setFakeExec()

        this.instance = this.NpmWorkspaceTypeChecker()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async checksTypesForAllNpmReposInWorkspacePath() {
        await this.instance.run()

        const calls = callsToExec.filter(
            (call) =>
                call.command === 'npx tsc --noEmit' &&
                (call.options?.cwd === this.repoPaths[0] ||
                    call.options?.cwd === this.repoPaths[1])
        )

        assert.isEqual(calls.length, 2, 'Failed to check types for first repo!')
    }

    private static setFakeReadDir() {
        NpmWorkspaceTypeChecker.readDir =
            fakeReadDir as unknown as typeof readdir
        resetCallsToReadDir()

        setFakeReadDirResult(this.workspacePath, [
            this.repoName1,
            this.repoName2,
        ])
    }

    private static setFakeExec() {
        NpmWorkspaceTypeChecker.exec = fakeExec as unknown as typeof exec
        resetCallsToExec()
    }

    private static NpmWorkspaceTypeChecker() {
        return NpmWorkspaceTypeChecker.Create(this.workspacePath)
    }
}
