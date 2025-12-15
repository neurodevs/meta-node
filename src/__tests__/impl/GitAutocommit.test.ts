import { exec as execSync } from 'node:child_process'
import { promisify } from 'node:util'

import {
    callsToExec,
    fakeExec,
    resetCallsToExec,
} from '@neurodevs/fake-node-core'
import AbstractModuleTest, { test, assert } from '@neurodevs/node-tdd'

import GitAutocommit, { Autocommit } from '../../impl/GitAutocommit.js'

const exec = promisify(execSync)

export default class GitAutocommitTest extends AbstractModuleTest {
    private static instance: Autocommit

    private static readonly commitMessage = this.generateId()
    private static readonly currentWorkingDir = this.generateId()

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeExec()

        this.instance = await this.GitAutocommit()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async callsExecThreeTimes() {
        assert.isEqualDeep(callsToExec, [
            { command: 'git add .', options: { cwd: this.currentWorkingDir } },
            {
                command: `git commit -m "${this.commitMessage}"`,
                options: { cwd: this.currentWorkingDir },
            },
            { command: 'git push', options: { cwd: this.currentWorkingDir } },
        ])
    }

    private static setFakeExec() {
        GitAutocommit.exec = fakeExec as unknown as typeof exec
        resetCallsToExec()
    }

    private static async GitAutocommit(
        commitMessage?: string,
        workingDir?: string
    ) {
        return GitAutocommit.Create(
            commitMessage ?? this.commitMessage,
            workingDir ?? this.currentWorkingDir
        )
    }
}
