import { ChildProcess, exec as execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { promisify } from 'node:util'
import {
    callsToExec,
    fakeExec,
    fakeReadFile,
    resetCallsToExec,
    resetCallsToReadFile,
    setFakeExecResult,
    setFakeReadFileResult,
} from '@neurodevs/fake-node-core'
import { test, assert } from '@neurodevs/node-tdd'

import GitAutocommit from '../../impl/GitAutocommit.js'
import NpmReleasePropagator, {
    ReleasePropagator,
    ReleasePropagatorOptions,
} from '../../impl/NpmReleasePropagator.js'
import { FakeAutocommit } from '../../index.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

const exec = promisify(execSync)

export default class NpmReleasePropagatorTest extends AbstractPackageTest {
    private static instance: ReleasePropagator

    private static readonly repoPaths = [this.generateId(), this.generateId()]

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeExec()
        this.setFakeReadFile()
        this.setFakeAutocommit()

        this.instance = this.NpmReleasePropagator()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async runInstallsReleaseForEachRepoPath() {
        await this.run()

        const expectedCalls = [
            {
                command: `yarn add ${this.packageName}@${this.packageVersion}`,
                options: { cwd: this.repoPaths[0] },
            },
            {
                command: `yarn add -D ${this.packageName}@${this.packageVersion}`,
                options: { cwd: this.repoPaths[1] },
            },
        ]

        assert.isEqualDeep(
            [callsToExec[2], callsToExec[4]],
            expectedCalls,
            'Did not install release in each repo path!'
        )
    }

    @test()
    protected static async commitsChangesToGit() {
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor,
            [
                {
                    commitMessage: `patch: propagate ${this.packageName}@${this.packageVersion} (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                    cwd: this.repoPaths[0],
                },
                {
                    commitMessage: `patch: propagate ${this.packageName}@${this.packageVersion} (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                    cwd: this.repoPaths[1],
                },
            ],
            'Did not commit changes to git for each repo path!'
        )
    }

    @test()
    protected static async doesNotInstallIfAlreadyUpToDate() {
        setFakeReadFileResult(
            `${this.repoPaths[0]}/package.json`,
            JSON.stringify(
                this.generatePackageJson({
                    dependencies: {
                        [this.packageName]: this.packageVersion,
                    },
                })
            )
        )

        await this.run()

        const execCalls = callsToExec.filter((call) =>
            call.command.includes(`yarn add`)
        )

        assert.isEqual(execCalls.length, 1, 'Should not have installed update!')
    }

    @test()
    protected static async throwsIfRepoDoesNotHavePreviousRelease() {
        const missingPackageName = this.generateId()

        this.instance = this.NpmReleasePropagator({
            packageName: missingPackageName,
        })

        await assert.doesThrowAsync(async () => {
            await this.run()
        }, `Cannot propagate release for ${missingPackageName} because it is not listed in either dependencies or devDependencies! Please install it in the target repository before running propagation.`)
    }

    @test()
    protected static async throwsIfGitHasUncommittedChanges() {
        setFakeExecResult('git status --porcelain', {
            stdout: 'M somefile.ts' as unknown as Readable,
        } as ChildProcess)

        await assert.doesThrowAsync(
            async () => {
                await this.run()
            },
            `Cannot propagate release because there are uncommitted git changes in the following repositories:

\t - ${this.repoPaths[0]}
\t - ${this.repoPaths[1]}

Please commit or stash these changes before running propagation!
`
        )
    }

    private static async run() {
        await this.instance.run()
    }

    private static setFakeExec() {
        NpmReleasePropagator.exec = fakeExec as unknown as typeof exec
        resetCallsToExec()

        this.setFakeMetaNodeVersion()
    }

    private static setFakeReadFile() {
        NpmReleasePropagator.readFile =
            fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()

        setFakeReadFileResult(
            `${this.repoPaths[0]}/package.json`,
            JSON.stringify(
                this.generatePackageJson({
                    dependencies: {
                        [this.packageName]: '2.0.0',
                    },
                })
            )
        )

        setFakeReadFileResult(
            `${this.repoPaths[1]}/package.json`,
            JSON.stringify(
                this.generatePackageJson({
                    devDependencies: {
                        [this.packageName]: '2.0.0',
                    },
                })
            )
        )
    }

    private static setFakeAutocommit() {
        GitAutocommit.Class = FakeAutocommit
        FakeAutocommit.resetTestDouble()
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
