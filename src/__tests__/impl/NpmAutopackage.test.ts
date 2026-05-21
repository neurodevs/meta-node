import { ChildProcess } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { mkdir } from 'fs/promises'
import path from 'path'
import {
    callsToExec,
    callsToFetch,
    callsToMkdir,
    callsToWriteFile,
    fakeExec,
    fakeFetch,
    fakeMkdir,
    fakePathExists,
    fakeReadFile,
    fakeWriteFile,
    resetCallsToExec,
    resetCallsToFetch,
    resetCallsToMkdir,
    resetCallsToPathExists,
    resetCallsToReadFile,
    resetCallsToWriteFile,
    resetFakeReadFileThrowsFor,
    setFakeExecResult,
    setFakeFetchResponse,
    setFakeReadFileResult,
    setFakeReadFileThrowsFor,
    setPathShouldExist,
} from '@neurodevs/fake-node-core'
import { test, assert } from '@neurodevs/node-tdd'

import GitAutocommit from '../../impl/GitAutocommit.js'
import NpmAutopackage, {
    Autopackage,
    AutopackageOptions,
} from '../../impl/NpmAutopackage.js'
import FakeAutocommit from '../../testDoubles/Autocommit/FakeAutocommit.js'
import AbstractAutopackageTest from '../AbstractAutopackageTest.js'

export default class NpmAutopackageTest extends AbstractAutopackageTest {
    private static instance: Autopackage

    protected static async beforeEach() {
        await super.beforeEach()

        this.fakeExec()
        this.fakeFetch()
        this.fakeMkdir()
        this.fakePathExists()
        this.fakeReadFile()
        this.fakeWriteFile()

        this.setFakeAutocommit()

        this.fakeFetchForRepoNotFound()

        process.env.GITHUB_TOKEN = this.githubToken

        setFakeExecResult('git status --porcelain', {
            stdout: 'M somefile.ts',
            stderr: '',
        } as unknown as ChildProcess)

        this.instance = this.NpmAutopackage()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async throwsIfGithubTokenNotSet() {
        delete process.env.GITHUB_TOKEN

        await assert.doesThrowAsync(
            async () => {
                const instance = this.NpmAutopackage()
                await instance.run()
            },
            'Please set process.env.GITHUB_TOKEN!',
            'Did not throw with missing process.env.GITHUB_TOKEN!'
        )
    }

    @test()
    protected static async firstCreateRepoInGithubOrg() {
        await this.run()

        assert.isEqualDeep(
            {
                passedUrl: callsToFetch[1]?.input,
                passedInit: callsToFetch[1]?.init,
            },
            {
                passedUrl: `https://api.github.com/orgs/${this.gitNamespace}/repos`,
                passedInit: {
                    method: 'POST',
                    headers: {
                        Authorization: `token ${this.githubToken}`,
                        Accept: 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: this.packageName,
                        private: false,
                        description: this.description,
                        auto_init: true,
                        gitignore_template: 'Node',
                        license_template: 'mit',
                    }),
                },
            },
            'Did not call fetch as expected!'
        )
    }

    @test()
    protected static async thenGitClone() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[0],
            {
                command: `git clone https://github.com/${this.gitNamespace}/${this.packageName}.git`,
                options: { cwd: this.installDir },
            },
            'Did not call git clone!'
        )
    }

    @test()
    protected static async thenGitFetchOrigin() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[1],
            { command: `git fetch origin`, options: { cwd: this.packageDir } },
            'Did not call git fetch origin!'
        )
    }

    @test()
    protected static async thenGitFetchResetHard() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[2],
            {
                command: `git reset --hard origin/main`,
                options: { cwd: this.packageDir },
            },
            'Did not call git reset hard!'
        )
    }

    @test()
    protected static async createsVscodeDirectory() {
        await this.run()

        assert.isEqualDeep(
            callsToMkdir[0],
            {
                path: path.join(this.packageDir, '.vscode'),
                options: { recursive: true },
            },
            'Did not create .vscode directory!'
        )
    }

    @test()
    protected static async thenInstallsTestsDirectory() {
        await this.run()

        assert.isEqualDeep(
            callsToMkdir[1],
            {
                path: this.testsDir,
                options: { recursive: true },
            },
            'Did not install tests directory!'
        )
    }

    @test()
    protected static async thenUpdatePackageJson() {
        await this.run()

        const actual = callsToWriteFile[0]

        const expected = {
            file: this.packageJsonPath,
            data: JSON.stringify(this.updatedPackageJson, null, 2) + '\n',
            options: { encoding: 'utf-8' },
        }

        assert.isEqualDeep(
            actual,
            expected,
            'Did not update package.json as expected!'
        )
    }

    @test()
    protected static async thenAddBuildDirToGitignore() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[1],
            {
                file: this.gitignorePath,
                data: '\nbuild/\n',
                options: { encoding: 'utf-8', flag: 'a' },
            },
            'Did not update .gitignore as expected!'
        )
    }

    @test()
    protected static async thenUpdatesTsconfig() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[2],
            {
                file: this.tsconfigPath,
                data: JSON.stringify(this.updatedTsconfig, null, 2) + '\n',
                options: { encoding: 'utf-8' },
            },
            'Did not update tsconfig as expected!'
        )
    }

    @test()
    protected static async thenUpdatesVscodeTasksJson() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[3],
            {
                file: this.tasksJsonPath,
                data: this.updatedTasksJson,
                options: { encoding: 'utf-8' },
            },
            'Did not update .vscode/tasks.json!'
        )
    }

    @test()
    protected static async thenUpdatesVscodeSettingsJson() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[4],
            {
                file: this.settingsJsonPath,
                data: this.settingsJsonFile,
                options: { encoding: 'utf-8' },
            },
            'Did not update .vscode/settings.json!'
        )
    }

    @test()
    protected static async thenUpdatesVscodeLaunchJson() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[5],
            {
                file: this.launchJsonPath,
                data: this.launchJsonFile,
                options: { encoding: 'utf-8' },
            },
            'Did not update .vscode/launch.json!'
        )
    }

    @test()
    protected static async thenInstallsDefaultDevDependencies() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToExec[8],
            {
                command: this.yarnInstallDevDepsCommand,
                options: { cwd: this.packageDir },
            },
            'Did not install default devDependencies!'
        )
    }

    @test()
    protected static async thenInstallsAbstractPackageTest() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[6],
            {
                file: this.abstractTestPath,
                data: this.abstractTestFile,
                options: { encoding: 'utf-8' },
            },
            'Did not install AbstractPackageTest!'
        )
    }

    @test()
    protected static async thenInstallsEslintConfigJs() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[7],
            {
                file: this.eslintConfigPath,
                data: this.eslintConfigFile,
                options: { encoding: 'utf-8' },
            },
            'Did not install eslint.config.js!'
        )
    }

    @test()
    protected static async thenInstallsPrettierConfigFile() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[8],
            {
                file: this.prettierConfigPath,
                data: this.prettierConfigFile,
                options: { encoding: 'utf-8' },
            },
            'Did not install prettier.config.js!'
        )
    }

    @test()
    protected static async thenInstallsNvmrcFile() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[9],
            {
                file: path.join(this.packageDir, '.nvmrc'),
                data: this.nvmrcFile,
                options: { encoding: 'utf-8' },
            },
            'Did not install .nvmrc file!'
        )
    }

    @test()
    protected static async thenFixesEslintAndPrettier() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToExec[9],
            {
                command: 'yarn build.dev',
                options: { cwd: this.packageDir },
            },
            'Did not fix eslint and prettier!'
        )
    }

    @test()
    protected static async thenCommitsChanges() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[0],
            {
                commitMessage: `patch: autopackage changes (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit autopackage changes!'
        )
    }

    @test()
    protected static async doesNotCommitFixEslintAndPrettierIfStderr() {
        setFakeExecResult('git status --porcelain', {
            stdout: 'Some changes',
            stderr: 'Some error',
        } as unknown as ChildProcess)

        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.filter(
                (call) =>
                    call?.commitMessage ===
                    `patch: fix eslint and prettier (@neurodevs/meta-node: ${this.metaNodeVersion})`
            ).length,
            0,
            'Should not commit fix eslint and prettier if stderr!'
        )
    }

    @test()
    protected static async doesNotCommitFixEslintAndPrettierIfNoChanges() {
        setFakeExecResult('git status --porcelain', {
            stdout: '',
            stderr: '',
        } as unknown as ChildProcess)

        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.filter(
                (call) =>
                    call?.commitMessage ===
                    `patch: fix eslint and prettier (@neurodevs/meta-node: ${this.metaNodeVersion})`
            ).length,
            0,
            'Should not commit fix eslint and prettier if no changes!'
        )
    }

    @test()
    protected static async lastlyOpensVscodeAtEnd() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[10],
            {
                command: 'code . --reuse-window --reload-window',
                options: { cwd: this.packageDir },
            },
            'Did not open vscode at end!'
        )
    }

    @test()
    protected static async removesCertainKeysFromPackageJson() {
        const keysToRemove = [
            'jest.testPathIgnorePatterns',
            'scripts.build.resolve-paths',
            'scripts.lint.tsc',
            'scripts.post.watch.build',
            'scripts.resolve-paths.lint',
            'scripts.watch.rebuild',
            'scripts.watch.tsc',
        ]

        for (const key of keysToRemove) {
            assert.isUndefined(
                this.getByPath(this.updatedPackageJson, key),
                `Did not remove ${key} from package.json!`
            )
        }
    }

    @test()
    protected static async installsEslintConfigIfNotExists() {
        setFakeReadFileThrowsFor(this.eslintConfigPath)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.eslintConfigPath
        )

        assert.isEqual(
            calls.length,
            1,
            'Should install eslint.config.js if it does not exist!'
        )
    }

    @test()
    protected static async installsPrettierConfigIfNotExists() {
        setFakeReadFileThrowsFor(this.prettierConfigPath)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.prettierConfigPath
        )

        assert.isEqual(
            calls.length,
            1,
            'Should install prettier.config.js if it does not exist!'
        )
    }

    @test()
    protected static async installsDevDependenciesIfGenerateIdNotLatest() {
        setFakeExecResult(this.checkGenerateIdVersionCmd, {
            stdout: '0.0.1',
        } as unknown as ChildProcess)

        await this.runTwice()

        const calls = callsToExec.filter(
            (call) => call?.command === this.yarnInstallDevDepsCommand
        )

        assert.isEqualDeep(
            calls[0],
            {
                command: this.yarnInstallDevDepsCommand,
                options: { cwd: this.packageDir },
            },
            'Should install default devDependencies if not already installed!'
        )
    }

    @test()
    protected static async installsDevDependenciesIfNodeTddNotLatest() {
        this.setShouldInstallDevDeps()
        await this.runTwice()

        const calls = callsToExec.filter(
            (call) => call?.command === this.yarnInstallDevDepsCommand
        )

        assert.isEqualDeep(
            calls[0],
            {
                command: this.yarnInstallDevDepsCommand,
                options: { cwd: this.packageDir },
            },
            'Should install default devDependencies if not already installed!'
        )
    }

    @test()
    protected static async installsDevDependenciesIfEslintConfigNdxNotLatest() {
        this.setShouldInstallDevDeps()
        await this.runTwice()

        const calls = callsToExec.filter(
            (call) => call?.command === this.yarnInstallDevDepsCommand
        )

        assert.isEqualDeep(
            calls[0],
            {
                command: this.yarnInstallDevDepsCommand,
                options: { cwd: this.packageDir },
            },
            'Should install default devDependencies if not already installed!'
        )
    }

    @test()
    protected static async installsDevDependenciesIfPrettierConfigNdxNotLatest() {
        this.setShouldInstallDevDeps()
        await this.runTwice()

        const calls = callsToExec.filter(
            (call) => call?.command === this.yarnInstallDevDepsCommand
        )

        assert.isEqualDeep(
            calls[0],
            {
                command: this.yarnInstallDevDepsCommand,
                options: { cwd: this.packageDir },
            },
            'Should install default devDependencies if not already installed!'
        )
    }

    @test()
    protected static async makeNpmNamespaceOptional() {
        resetCallsToWriteFile()

        const instance = this.NpmAutopackage({
            npmNamespace: undefined,
        })

        await instance.run()

        assert.doesInclude(
            callsToWriteFile[0]?.data,
            `"name": "${this.packageName}"`,
            'Did not handle missing npmNamespace!'
        )
    }

    @test()
    protected static async removesEsVersionsOtherThanEsnextFromLib() {
        setFakeReadFileResult(
            this.tsconfigPath,
            JSON.stringify({
                ...this.tsconfigCustom,
                compilerOptions: {
                    ...this.tsconfigCustom.compilerOptions,
                    lib: ['es6', 'es2017', 'esnext', 'ES2015'],
                },
            })
        )

        await this.run()

        const tsconfigWrites = callsToWriteFile.filter(
            (call) => call.file === this.tsconfigPath
        )

        const json = JSON.parse(tsconfigWrites[0].data)

        assert.isEqualDeep(
            json.compilerOptions.lib,
            ['esnext'],
            'Should update tsconfig to only include esnext in lib!'
        )
    }

    @test()
    protected static async createsTsconfigFromTemplateWhenItDoesNotExist() {
        setFakeReadFileThrowsFor(this.tsconfigPath)

        await this.run()

        const tsconfigWrites = callsToWriteFile.filter(
            (call) => call.file === this.tsconfigPath
        )

        const json = JSON.parse(tsconfigWrites[0].data)

        assert.isEqualDeep(
            json,
            this.tsconfigTemplate,
            'Did not create tsconfig from template!'
        )
    }

    @test()
    protected static async createsGitignoreFromTemplateWhenItDoesNotExist() {
        setFakeReadFileThrowsFor(this.gitignorePath)

        await this.run()

        const gitignoreWrites = callsToWriteFile.filter(
            (call) => call.file === this.gitignorePath
        )

        const text = gitignoreWrites[0].data

        assert.isEqualDeep(
            text,
            this.gitignoreTemplate,
            'Did not create gitignore from template!'
        )
    }

    @test()
    protected static async createsTasksJsonFromTemplateWhenItDoesNotExist() {
        setFakeReadFileThrowsFor(this.tasksJsonPath)

        await this.run()

        const tasksJsonWrites = callsToWriteFile.filter(
            (call) => call.file === this.tasksJsonPath
        )

        const json = JSON.parse(tasksJsonWrites[0].data)

        assert.isEqualDeep(
            json,
            this.tasksJsonTemplate,
            'Did not create tasks.json from template!'
        )
    }

    @test()
    protected static async createsPackageJsonFromTemplateWhenItDoesNotExist() {
        setFakeReadFileThrowsFor(this.packageJsonPath)

        await this.run()

        const packageJsonWrites = callsToWriteFile.filter(
            (call) => call.file === this.packageJsonPath
        )

        const json = JSON.parse(packageJsonWrites[0].data)

        assert.isEqualDeep(
            json,
            this.packageJsonTemplate,
            'Did not create package.json from template!'
        )
    }

    @test()
    protected static async createsSettingsJsonFromTemplateWhenItDoesNotExist() {
        setFakeReadFileThrowsFor(this.settingsJsonPath)

        await this.run()

        const settingsJsonWrites = callsToWriteFile.filter(
            (call) => call.file === this.settingsJsonPath
        )

        assert.isEqualDeep(
            settingsJsonWrites[0].data,
            this.settingsJsonFile,
            'Did not create settings.json from template!'
        )
    }

    @test()
    protected static async doesNotCreateRepoInGithubOrgIfDone() {
        await this.runTwice()

        const numCalls = callsToFetch.filter(
            (call) => call.input === this.orgsUrl
        ).length

        assert.isEqual(numCalls, 1, 'Should have created repo once!')
    }

    @test()
    protected static async doesNotCloneRepoIfDone() {
        await this.runTwice()

        assert.isEqual(
            callsToExec.filter(
                (call) =>
                    call?.command ===
                    `git clone https://github.com/${this.gitNamespace}/${this.packageName}.git`
            ).length,
            1,
            'Did not clone repo once!'
        )
    }

    @test()
    protected static async doesNotUpdateTsconfigIfAlreadyUpToDate() {
        setFakeReadFileResult(
            this.tsconfigPath,
            JSON.stringify(this.updatedTsconfig, null, 2)
        )

        await this.run()

        const tsconfigWrites = callsToWriteFile.filter(
            (call) => call.file === this.tsconfigPath
        )

        assert.isEqual(
            tsconfigWrites.length,
            0,
            'Should not update tsconfig when only extra keys differ!'
        )
    }

    @test()
    protected static async doesNotInstallTasksJsonIfEqual() {
        await this.runTwice()

        assert.isEqualDeep(
            callsToWriteFile.filter((call) => call.file === this.tasksJsonPath)
                .length,
            1,
            'Did not update tasks.json once!'
        )
    }

    @test()
    protected static async doesNotInstallSettingsJsonIfEqual() {
        setFakeReadFileResult(this.settingsJsonPath, this.settingsJsonFile)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.settingsJsonPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install settings.json if contents are equal!'
        )
    }

    @test()
    protected static async doesNotInstallLaunchJsonIfEqual() {
        setFakeReadFileResult(this.launchJsonPath, this.launchJsonFile)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.launchJsonPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install launch.json if contents are equal!'
        )
    }

    @test()
    protected static async doesNotInstallLaunchJsonIfSemanticallyEqual() {
        const parsed = JSON.parse(this.launchJsonFile)
        const reformatted = JSON.stringify(parsed, null, '\t')
        setFakeReadFileResult(this.launchJsonPath, reformatted)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.launchJsonPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install launch.json if contents are semantically equal!'
        )
    }

    @test()
    protected static async doesNotRemoveOldDevDependenciesIfNotPresent() {
        setFakeReadFileResult(
            this.packageJsonPath,
            JSON.stringify(this.packageJsonCustom)
        )

        this.setShouldInstallDevDeps()
        await this.run()

        const calls = callsToExec.filter(
            (call) => call?.command === this.yarnRemoveDevDepsCommand
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not remove old devDependencies if not present!'
        )
    }

    @test()
    protected static async doesNotInstallDevDependenciesIfInDependencies() {
        setFakeReadFileResult(
            this.packageJsonPath,
            JSON.stringify({
                ...this.packageJsonCustom,
                dependencies: {
                    '@neurodevs/generate-id': '^1.0.0',
                    '@neurodevs/node-tdd': '^1.0.0',
                    '@neurodevs/eslint-config-ndx': '^1.0.0',
                    '@neurodevs/prettier-config-ndx': '^1.0.0',
                },
                devDependencies: {},
            })
        )

        await this.run()

        const calls = callsToExec.filter(
            (call) => call?.command === this.yarnInstallDevDepsCommand
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install devDependencies if already in dependencies!'
        )
    }

    @test()
    protected static async doesNotOverrideOriginalDependencies() {
        await this.runTwice()

        assert.isEqualDeep(
            JSON.parse(callsToWriteFile[0]?.data).dependencies,
            this.dependencies,
            'Did not update package.json as expected!'
        )
    }

    @test()
    protected static async doesNotCommitIfNoChanges() {
        setFakeExecResult('git status --porcelain', {
            stdout: '',
            stderr: '',
        } as unknown as ChildProcess)

        await this.run()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.length,
            0,
            'Should not commit if no changes!'
        )
    }

    @test()
    protected static async doesNotOpenVscodeIfNotCloned() {
        setPathShouldExist(this.packageDir, true)

        await this.run()

        assert.isFalse(
            callsToExec.some((call) => call?.command === 'code .'),
            'Should not open vscode if not cloned!'
        )
    }

    @test()
    protected static async doesNotThrowIfGenerateIdNotInPackageJson() {
        setFakeReadFileResult(
            this.packageJsonPath,
            JSON.stringify(this.packageJsonCustom).replace(
                '@neurodevs/generate-id',
                ''
            )
        )

        await this.runTwice()
    }

    @test()
    protected static async doesNotInstallAbstractPackageTestIfTsExists() {
        setPathShouldExist(this.abstractTestPath, true)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.abstractTestPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install AbstractPackageTest.ts if already exists!'
        )
    }

    @test()
    protected static async doesNotInstallAbstractPackageTestIfTsxExists() {
        setPathShouldExist(`${this.abstractTestPath}x`, true)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.abstractTestPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install AbstractPackageTest.tsx if already exists!'
        )
    }

    @test()
    protected static async doesNotInstallAbstractPackageTestIfNoTestDir() {
        setPathShouldExist(this.testsDir, false)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.abstractTestPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install AbstractPackageTest.ts if no __tests__ directory exists!'
        )
    }

    @test()
    protected static async doesNotInstallDevDependenciesIfNoTestsDir() {
        setPathShouldExist(this.testsDir, false)
        this.setShouldInstallDevDeps()

        await this.run()

        const calls = callsToExec.filter(
            (call) => call?.command === this.yarnInstallDevDepsCommand
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install devDependencies if no __tests__ directory exists!'
        )
    }

    @test()
    protected static async doesNotInstallEslintConfigFileIfContentsEqual() {
        setFakeReadFileResult(this.eslintConfigPath, this.eslintConfigFile)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.eslintConfigPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install eslint.config.js if contents are equal!'
        )
    }

    @test()
    protected static async doesNotInstallPrettierConfigFileIfContentsEqual() {
        setFakeReadFileResult(this.prettierConfigPath, this.prettierConfigFile)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.prettierConfigPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install prettier.config.js if contents are equal!'
        )
    }

    @test()
    protected static async doesNotInstallEslintConfigFileForEslintConfigNdxPackage() {
        const eslintConfigPath = path.join(
            this.installDir,
            'eslint-config-ndx',
            'eslint.config.js'
        )

        setFakeReadFileResult(eslintConfigPath, this.generateId())

        const instance = this.NpmAutopackage({
            name: 'eslint-config-ndx',
        })

        //@ts-ignore
        await instance.installEslintConfigFile()

        const calls = callsToWriteFile.filter(
            (call) => call.file === eslintConfigPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install eslint.config.js for eslint-config-ndx package!'
        )
    }

    @test()
    protected static async doesNotInstallPrettierConfigFileForPrettierConfigNdxPackage() {
        const prettierConfigPath = path.join(
            this.installDir,
            'prettier-config-ndx',
            'prettier.config.js'
        )

        setFakeReadFileResult(prettierConfigPath, this.generateId())

        const instance = this.NpmAutopackage({
            name: 'prettier-config-ndx',
        })

        //@ts-ignore
        await instance.installPrettierConfigFile()

        const calls = callsToWriteFile.filter(
            (call) => call.file === prettierConfigPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install prettier.config.js for prettier-config-ndx package!'
        )
    }

    @test()
    protected static async doesNotInstallNvmrcFileIfInstalled() {
        const nvmrcPath = path.join(this.packageDir, '.nvmrc')
        setFakeReadFileResult(nvmrcPath, this.nvmrcFile)

        await this.run()

        const calls = callsToWriteFile.filter((call) => call.file === nvmrcPath)

        assert.isEqual(
            calls.length,
            0,
            'Should not install .nvmrc if already installed!'
        )
    }

    @test()
    protected static async overridesOldBuildDevScriptWithTemplateValue() {
        setFakeReadFileResult(
            this.packageJsonPath,
            JSON.stringify({
                ...this.packageJsonCustom,
                scripts: {
                    ...this.packageJsonCustom.scripts,
                    'build.dev':
                        'yarn run build.tsc --sourceMap ; yarn run fix.lint ; prettier --write .',
                },
            })
        )

        await this.run()

        const packageJsonWrites = callsToWriteFile.filter(
            (call) => call.file === this.packageJsonPath
        )

        const json = JSON.parse(packageJsonWrites[0].data)

        assert.isEqual(
            json.scripts['build.dev'],
            'yarn run build.tsc --sourceMap ; yarn run fix.lint ; prettier --write . --log-level warn',
            'Did not override old build.dev script with updated template value!'
        )
    }

    @test()
    protected static async doesNotDeleteModuleNameMapperIfOtherKeysPresent() {
        const moduleNameMapperKey = this.generateId()

        setFakeReadFileResult(
            this.packageJsonPath,
            JSON.stringify({
                ...this.packageJsonCustom,
                jest: {
                    moduleNameMapper: {
                        [moduleNameMapperKey]: '',
                    },
                },
            })
        )

        await this.run()

        assert.isTruthy(
            callsToWriteFile.some(
                (call) =>
                    call.file === this.packageJsonPath &&
                    call.data.includes(moduleNameMapperKey)
            ),
            'Should not delete jest.moduleNameMapper if other keys are present!'
        )
    }

    private static async run() {
        await this.instance.run()
    }

    private static async runTwice() {
        await this.run()

        setPathShouldExist(this.packageDir, true)
        setPathShouldExist(this.packageJsonPath, true)
        setPathShouldExist(this.abstractTestPath, true)
        setPathShouldExist(this.tasksJsonPath, true)

        setFakeReadFileResult(
            this.packageJsonPath,
            JSON.stringify(this.updatedPackageJson)
        )

        setFakeReadFileResult(this.gitignorePath, this.updatedGitignore)
        setFakeReadFileResult(this.tasksJsonPath, this.updatedTasksJson)

        setFakeReadFileResult(
            this.tsconfigPath,
            JSON.stringify(this.updatedTsconfig)
        )

        const fakeResponse = new Response(null, {
            status: 200,
            statusText: 'OK',
        })

        setFakeFetchResponse(this.reposUrl, fakeResponse)

        await this.run()
    }

    private static getByPath(obj: any, path: string) {
        return path
            .split('.')
            .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
    }

    private static setShouldInstallDevDeps() {
        setFakeExecResult(this.checkGenerateIdVersionCmd, {
            stdout: '0.0.1',
        } as unknown as ChildProcess)
    }

    private static fakeExec() {
        NpmAutopackage.exec = fakeExec as any
        resetCallsToExec()

        this.setFakeMetaNodeVersion()

        setFakeExecResult(this.checkGenerateIdVersionCmd, {
            stdout: '1.0.0',
        } as unknown as ChildProcess)

        setFakeExecResult(this.checkNodeTddVersionCmd, {
            stdout: '1.0.0',
        } as unknown as ChildProcess)

        setFakeExecResult(this.checkEslintConfigNdxVersionCmd, {
            stdout: '1.0.0',
        } as unknown as ChildProcess)

        setFakeExecResult(this.checkPrettierConfigNdxVersionCmd, {
            stdout: '1.0.0',
        } as unknown as ChildProcess)
    }

    private static fakeFetch() {
        NpmAutopackage.fetch = fakeFetch as unknown as typeof fetch
        resetCallsToFetch()
    }

    private static fakeMkdir() {
        NpmAutopackage.mkdir = fakeMkdir as unknown as typeof mkdir
        resetCallsToMkdir()
    }

    private static fakePathExists() {
        NpmAutopackage.pathExists = fakePathExists
        resetCallsToPathExists()

        setPathShouldExist(this.packageDir, false)
        setPathShouldExist(this.packageJsonPath, false)
        setPathShouldExist(this.tasksJsonPath, false)
        setPathShouldExist(this.abstractTestPath, false)
        setPathShouldExist(`${this.abstractTestPath}x`, false)
        setPathShouldExist(this.testsDir, true)
    }

    private static fakeReadFile() {
        NpmAutopackage.readFile = fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()

        setFakeReadFileResult(
            this.packageJsonPath,
            JSON.stringify(this.packageJsonCustom)
        )

        setFakeReadFileResult(
            this.tasksJsonPath,
            JSON.stringify(this.tasksJsonCustom)
        )

        setFakeReadFileResult(
            this.tsconfigPath,
            JSON.stringify(this.tsconfigCustom)
        )

        setFakeReadFileResult(this.gitignorePath, this.gitignoreCustom)

        resetFakeReadFileThrowsFor()
    }

    private static fakeWriteFile() {
        NpmAutopackage.writeFile = fakeWriteFile as unknown as typeof writeFile
        resetCallsToWriteFile()
    }

    private static setFakeAutocommit() {
        GitAutocommit.Class = FakeAutocommit
        FakeAutocommit.resetTestDouble()
    }

    private static fakeFetchForRepoNotFound() {
        const fakeResponse = new Response(null, {
            status: 404,
            statusText: 'Not Found',
        })

        setFakeFetchResponse(this.reposUrl, fakeResponse)
        setFakeFetchResponse(this.prettierConfigNdxUrl, fakeResponse)
    }

    private static get reposUrl() {
        return `https://api.github.com/repos/${this.gitNamespace}/${this.packageName}`
    }

    private static get prettierConfigNdxUrl() {
        return `https://api.github.com/repos/${this.gitNamespace}/prettier-config-ndx`
    }

    private static get orgsUrl() {
        return `https://api.github.com/orgs/${this.gitNamespace}/repos`
    }

    private static NpmAutopackage(options?: Partial<AutopackageOptions>) {
        return NpmAutopackage.Create({ ...this.autopackageOptions, ...options })
    }
}
