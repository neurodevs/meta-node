import { ChildProcess } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { Readable } from 'node:stream'

import {
    callsToError,
    callsToExec,
    callsToWarn,
    fakeConsole,
    fakeExec,
    fakeReadFile,
    resetCallsToExec,
    resetCallsToReadFile,
    resetExecThrowsFor,
    resetFakeConsole,
    setExecThrowsFor,
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

export default class NpmReleasePropagatorTest extends AbstractPackageTest {
    private static instance: ReleasePropagator

    private static readonly repoPaths = [this.generateId(), this.generateId()]

    private static readonly defaultConcurrency = 4

    private static readonly typeErrorSummaryPrefix = 'Type errors detected'
    private static readonly failureSummaryPrefix = 'Failed to propagate'

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeExec()
        this.setFakeReadFile()
        this.setFakeAutocommit()
        this.setFakeError()

        this.instance = this.NpmReleasePropagator()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async runInstallsReleaseForEachRepoPath() {
        await this.run()

        const actualCalls = callsToExec.filter((call) =>
            call.command.includes(`yarn add`)
        )

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
            actualCalls,
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
    protected static async buildsBeforeCheckingTypeErrors() {
        await this.run()

        for (const repoPath of this.repoPaths) {
            const commands = callsToExec
                .filter((call) => call.options?.cwd === repoPath)
                .map((call) => call.command)

            const buildIdx = commands.indexOf('yarn build.dev')
            const typeCheckIdx = commands.indexOf('npx tsc --noEmit')

            assert.isTrue(
                buildIdx > -1,
                `Did not run yarn build.dev for ${repoPath}!`
            )

            assert.isTrue(
                buildIdx < typeCheckIdx,
                `Did not run yarn build.dev before checking type errors for ${repoPath}!`
            )
        }
    }

    @test()
    protected static async keepsChangesIfThereAreTypeErrors() {
        setExecThrowsFor(`npx tsc --noEmit`)

        await this.run()

        const rollbackCall = callsToExec.find((call) =>
            call.command.includes('git reset --hard')
        )

        assert.isFalsy(
            rollbackCall,
            'Should not have rolled back changes with type errors!'
        )
    }

    @test()
    protected static async doesNotCommitIfBuildFails() {
        setExecThrowsFor('yarn build.dev')

        await this.run()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.length,
            0,
            'Should not have committed changes!'
        )
    }

    @test()
    protected static async warnsForEachRepoWithTypeErrors() {
        setExecThrowsFor(`npx tsc --noEmit`)

        await this.run()

        const messages = callsToWarn.map((call) => String(call.message))

        for (const repoPath of this.repoPaths) {
            assert.isTrue(
                messages.includes(
                    `Skipping commit for ${repoPath} due to type errors...`
                ),
                `Did not warn that the commit was skipped for ${repoPath}!`
            )
        }
    }

    @test()
    protected static async doesNotCommitIfThereAreTypeErrors() {
        setExecThrowsFor(`npx tsc --noEmit`)

        await this.run()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.length,
            0,
            'Should not have committed changes!'
        )
    }

    @test()
    protected static async doesNotCommitIfPassedOptionalParameter() {
        const instance = this.NpmReleasePropagator({ shouldGitCommit: false })

        await instance.run()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.length,
            0,
            'Should not have committed changes!'
        )
    }

    @test()
    protected static async logsReposWithTypeErrorsOnceAllHaveSettled() {
        setExecThrowsFor(`npx tsc --noEmit`)

        await this.run()

        const summary = this.findLoggedError(this.typeErrorSummaryPrefix)

        assert.isTruthy(
            summary,
            'Did not log a summary of repos with type errors!'
        )

        for (const repoPath of this.repoPaths) {
            assert.isTrue(
                summary!.includes(repoPath),
                `Did not include ${repoPath} in the type error summary!`
            )
        }
    }

    @test()
    protected static async doesNotLogTypeErrorSummaryWhenAllSucceed() {
        await this.run()

        assert.isFalsy(
            this.findLoggedError(this.typeErrorSummaryPrefix),
            'Should not have logged a type error summary!'
        )
    }

    @test()
    protected static async failedRepoDoesNotInterruptOtherRepos() {
        setExecThrowsFor(`yarn add ${this.packageName}@${this.packageVersion}`)

        await this.run()

        const installCall = callsToExec.find(
            (call) =>
                call.command ===
                    `yarn add -D ${this.packageName}@${this.packageVersion}` &&
                call.options?.cwd === this.repoPaths[1]
        )

        assert.isTruthy(
            installCall,
            'Failure in one repo should not interrupt the others!'
        )

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor,
            [
                {
                    commitMessage: `patch: propagate ${this.packageName}@${this.packageVersion} (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                    cwd: this.repoPaths[1],
                },
            ],
            'Should still have committed the repo that succeeded!'
        )
    }

    @test()
    protected static async logsReposThatFailedToPropagate() {
        setExecThrowsFor(`yarn add ${this.packageName}@${this.packageVersion}`)

        await this.run()

        const summary = this.findLoggedError(this.failureSummaryPrefix)

        assert.isTruthy(summary, 'Did not log a summary of failed repos!')

        assert.isTrue(
            summary!.includes(this.repoPaths[0]),
            `Did not include ${this.repoPaths[0]} in the failure summary!`
        )

        assert.isFalse(
            summary!.includes(this.repoPaths[1]),
            `Should not have included the repo that succeeded!`
        )
    }

    @test()
    protected static async boundsHowManyReposInstallAtOnce() {
        const repoPaths = this.setFakeReposForConcurrency(6)

        const instance = this.NpmReleasePropagator({
            repoPaths,
            concurrency: 2,
        })

        await instance.run()

        assert.isEqual(
            this.maxConcurrentInstalls,
            2,
            'Did not bound how many repos install at once!'
        )
    }

    @test()
    protected static async boundsConcurrencyByDefault() {
        const repoPaths = this.setFakeReposForConcurrency(12)

        const instance = this.NpmReleasePropagator({ repoPaths })

        await instance.run()

        assert.isEqual(
            this.maxConcurrentInstalls,
            this.defaultConcurrency,
            'Did not bound concurrency by default!'
        )
    }

    @test()
    protected static async stillPropagatesToEveryRepoWhenBounded() {
        const repoPaths = this.setFakeReposForConcurrency(6)

        const instance = this.NpmReleasePropagator({
            repoPaths,
            concurrency: 2,
        })

        await instance.run()

        const installCalls = callsToExec.filter((call) =>
            call.command.includes('yarn add')
        )

        assert.isEqual(
            installCalls.length,
            repoPaths.length,
            'Did not propagate to every repo path!'
        )
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

    private static findLoggedError(prefix: string) {
        const call = callsToError.find((call) =>
            String(call.message).includes(prefix)
        )

        return call ? String(call.message) : undefined
    }

    private static maxConcurrentInstalls = 0

    private static setFakeReposForConcurrency(count: number) {
        const repoPaths = Array.from({ length: count }, () => this.generateId())

        for (const repoPath of repoPaths) {
            setFakeReadFileResult(
                `${repoPath}/package.json`,
                JSON.stringify(
                    this.generatePackageJson({
                        devDependencies: {
                            [this.packageName]: '2.0.0',
                        },
                    })
                )
            )
        }

        this.setFakeExecThatTracksConcurrency()

        return repoPaths
    }

    private static setFakeExecThatTracksConcurrency() {
        let numInFlight = 0
        this.maxConcurrentInstalls = 0

        NpmReleasePropagator.exec = (async (
            command: string,
            options?: Record<string, unknown>
        ) => {
            if (!command.startsWith('yarn add')) {
                return fakeExec(command, options)
            }

            numInFlight++

            this.maxConcurrentInstalls = Math.max(
                this.maxConcurrentInstalls,
                numInFlight
            )

            try {
                await this.waitForOtherInstallsToStart()
                return await fakeExec(command, options)
            } finally {
                numInFlight--
            }
        }) as unknown as typeof this.exec
    }

    private static async waitForOtherInstallsToStart() {
        await new Promise((resolve) => setTimeout(resolve, 10))
    }

    private static setFakeError() {
        NpmReleasePropagator.log = fakeConsole
        resetFakeConsole()
    }

    private static setFakeExec() {
        NpmReleasePropagator.exec = fakeExec as unknown as typeof this.exec
        resetCallsToExec()
        resetExecThrowsFor()

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
