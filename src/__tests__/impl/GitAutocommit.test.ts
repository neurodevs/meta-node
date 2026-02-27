import {
    callsToExec,
    fakeExec,
    resetCallsToExec,
} from '@neurodevs/fake-node-core'
import { test, assert } from '@neurodevs/node-tdd'

import GitAutocommit, { Autocommit } from '../../impl/GitAutocommit.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class GitAutocommitTest extends AbstractPackageTest {
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
        GitAutocommit.exec = fakeExec as unknown as typeof this.exec
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
