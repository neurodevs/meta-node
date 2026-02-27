import { ChildProcess } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { mkdir } from 'fs/promises'
import path from 'path'
import {
    callsToExec,
    callsToFetch,
    callsToMkdir,
    callsToReadFile,
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
    setFakeExecResult,
    setFakeFetchResponse,
    setFakeReadFileResult,
    setPathShouldExist,
} from '@neurodevs/fake-node-core'
import { test, assert } from '@neurodevs/node-tdd'

import GitAutocommit from '../../impl/GitAutocommit.js'
import NpmAutopackage, {
    Autopackage,
    AutopackageOptions,
    TsConfig,
} from '../../impl/NpmAutopackage.js'
import FakeAutocommit from '../../testDoubles/Autocommit/FakeAutocommit.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class NpmAutopackageTest extends AbstractPackageTest {
    private static instance: Autopackage

    private static readonly installDir = this.generateId()
    private static readonly description = this.generateId()
    private static readonly gitNamespace = this.generateId()
    private static readonly npmNamespace = this.generateId()
    private static readonly keywords = [this.generateId(), this.generateId()]
    private static readonly license = this.generateId()
    private static readonly author = this.generateId()
    private static readonly githubToken = this.generateId()
    private static readonly randomId = this.generateId()

    private static readonly packageDir = path.join(
        this.installDir,
        this.packageName
    )

    private static readonly packageJsonPath = path.join(
        this.packageDir,
        'package.json'
    )

    private static readonly gitignorePath = path.join(
        this.packageDir,
        '.gitignore'
    )

    private static readonly originalGitignore = this.generateId()

    private static readonly updatedGitignore = `${this.originalGitignore}\nbuild/`

    private static readonly tsconfigPath = path.join(
        this.packageDir,
        'tsconfig.json'
    )

    private static readonly tasksJsonPath = path.join(
        this.packageDir,
        '.vscode',
        'tasks.json'
    )

    private static readonly testDirPath = path.join(
        this.packageDir,
        'src',
        '__tests__'
    )

    private static readonly abstractTestPath = path.join(
        this.testDirPath,
        'AbstractPackageTest.ts'
    )

    private static readonly eslintConfigMjsPath = path.join(
        this.packageDir,
        'eslint.config.mjs'
    )

    private static readonly eslintConfigJsPath = path.join(
        this.packageDir,
        'eslint.config.js'
    )

    private static readonly prettierConfigPath = path.join(
        this.packageDir,
        'prettier.config.js'
    )

    private static readonly settingsJsonPath = path.join(
        this.packageDir,
        '.vscode',
        'settings.json'
    )

    private static readonly customLib = this.generateId()
    private static readonly customType = this.generateId()
    private static readonly customInclude = this.generateId()
    private static readonly customOption = this.generateId()

    private static readonly setupVscodeCmd = 'spruce setup.vscode --all true'

    private static readonly checkGenerateIdVersionCmd = `yarn info @neurodevs/generate-id version --silent`
    private static readonly checkNodeTddVersionCmd = `yarn info @neurodevs/node-tdd version --silent`
    private static readonly checkEslintConfigNdxVersionCmd = `yarn info @neurodevs/eslint-config-ndx version --silent`
    private static readonly checkPrettierConfigNdxVersionCmd = `yarn info @neurodevs/prettier-config-ndx version --silent`

    private static readonly dependencies = {
        [this.generateId()]: this.generateId(),
        [this.generateId()]: this.generateId(),
    }

    private static readonly yarnInstallDevDepsCommand =
        'yarn add -D @neurodevs/generate-id @neurodevs/node-tdd @neurodevs/eslint-config-ndx @neurodevs/prettier-config-ndx'

    private static readonly abstractTestFile = `import AbstractModuleTest from '@neurodevs/node-tdd'

export default abstract class AbstractPackageTest extends AbstractModuleTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }
}
`

    private static readonly eslintConfigFile = `import esConfigNdx from '@neurodevs/eslint-config-ndx'

export default esConfigNdx
`

    private static readonly prettierConfigFile = `import prettierConfigNdx from '@neurodevs/prettier-config-ndx'

export default prettierConfigNdx
`

private static readonly settingsJsonFile = `{
  "debug.node.autoAttach": "on",
  "git.ignoreLimitWarning": true,
  "javascript.validate.enable": false,
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/build/**": true,
    "**/node_modules/**": true
  },
  "search.exclude": {
    "**/build/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  },
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.maxTokenizationLineLength": 20000000,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "eslint.enable": true,
  "eslint.useFlatConfig": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": ["./"],
  "debug.javascript.unmapMissingSources": true,
  "javascript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.validate.enable": true,
  "cSpell.ignorePaths": [
    "**/package-lock.json",
    "**/node_modules/**",
    "**/build/**",
    "**/vscode-extension/**",
    "**/.git/objects/**",
    ".vscode",
    ".spruce"
  ],
  "cSpell.words": ["arkit", "autogenerated", "scrollable", "serializable"]
}
`

    private static readonly defaultOptions = {
        installDir: this.installDir,
        name: this.packageName,
        description: this.description,
        gitNamespace: this.gitNamespace,
        npmNamespace: this.npmNamespace,
        keywords: this.keywords,
        license: this.license,
        author: this.author,
    }

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
    protected static async thenSpruceCreateModule() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[4],
            {
                command: this.createModuleCmd,
                options: { cwd: this.packageDir },
            },
            'Did not call "spruce create.module"!'
        )
    }

    @test()
    protected static async thenCommitCreatePackage() {
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[0],
            {
                commitMessage: `patch: create package (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit create package changes!'
        )
    }

    @test()
    protected static async thenReadPackageJson() {
        await this.run()

        assert.isEqualDeep(callsToReadFile[1], {
            path: this.packageJsonPath,
            options: { encoding: 'utf-8' },
        })
    }

    @test()
    protected static async thenUpdatePackageJson() {
        await this.run()

        const actual = callsToWriteFile[0]

        const ordered = this.orderJsonKeys(
            JSON.parse(this.updatedPackageJson),
            [
                'name',
                'version',
                'description',
                'keywords',
                'license',
                'author',
                'homepage',
                'repository',
                'bugs',
                'main',
                'bin',
                'files',
                'scripts',
                'dependencies',
                'devDependencies',
                'jest',
                'skill',
            ]
        )

        const expected = {
            file: this.packageJsonPath,
            data: JSON.stringify(ordered, null, 2) + '\n',
            options: { encoding: 'utf-8' },
        }

        assert.isEqualDeep(
            {
                ...actual,
                data: this.normalize(actual.data),
            },
            {
                ...expected,
                data: this.normalize(expected.data),
            },
            'Did not update package.json as expected!'
        )
    }

    @test()
    protected static async thenCommitUpdatePackage() {
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[1],
            {
                commitMessage: `patch: update package.json (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit update package changes!'
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
    protected static async thenCommitUpdateGitignore() {
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[2],
            {
                commitMessage: `patch: add build dir to gitignore (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit .gitignore changes!'
        )
    }

    @test()
    protected static async thenUpdatesTsconfig() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[2],
            {
                file: this.tsconfigPath,
                data: JSON.stringify(this.updatedTsconfig, null, 4) + '\n',
                options: { encoding: 'utf-8', flag: 'a' },
            },
            'Did not update tsconfig as expected!'
        )
    }

    @test()
    protected static async thenCommitsUpdateTsconfig() {
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[3],
            {
                commitMessage: `patch: update tsconfig (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit tsconfig changes!'
        )
    }

    @test()
    protected static async thenSpruceSetupVscode() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[5],
            {
                command: this.setupVscodeCmd,
                options: { cwd: this.packageDir },
            },
            'Did not call "spruce setup.vscode"!'
        )
    }

    @test()
    protected static async thenCommitVscodeChanges() {
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[4],
            {
                commitMessage: `patch: setup vscode (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit vscode changes!'
        )
    }

    @test()
    protected static async thenUpdatesVscodeTasksJson() {
        await this.run()

        assert.isEqualDeep(callsToWriteFile[3], {
            file: this.tasksJsonPath,
            data: this.updatedTasksJson,
            options: { encoding: 'utf-8' },
        })
    }

    @test()
    protected static async thenCommitsUpdateVscodeTasksJson() {
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[5],
            {
                commitMessage: `patch: update vscode tasks.json (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit updated vscode tasks.json changes!'
        )
    }

    @test()
    protected static async thenInstallsDefaultDevDependencies() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToExec[10],
            {
                command: this.yarnInstallDevDepsCommand,
                options: { cwd: this.packageDir },
            },
            'Did not install default devDependencies!'
        )
    }

    @test()
    protected static async thenCommitsInstallDefaultDevDependencies() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[6],
            {
                commitMessage: `patch: install default devDependencies (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit install devDependencies changes!'
        )
    }

    @test()
    protected static async thenInstallsTestsDirectory() {
        await this.run()

        assert.isEqualDeep(
            callsToMkdir[0],
            {
                path: this.testDirPath,
                options: { recursive: true },
            },
            'Did not install tests directory!'
        )
    }

    @test()
    protected static async thenInstallsAbstractPackageTest() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[4],
            {
                file: this.abstractTestPath,
                data: this.abstractTestFile,
                options: { encoding: 'utf-8' },
            },
            'Did not install AbstractPackageTest!'
        )
    }

    @test()
    protected static async thenCommitsInstallAbstractPackageTest() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[7],
            {
                commitMessage: `patch: install AbstractPackageTest (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit install AbstractPackageTest changes!'
        )
    }

    @test()
    protected static async thenDeletesOldEslintConfigMjs() {
        setPathShouldExist(
            path.join(this.packageDir, 'eslint.config.mjs'),
            true
        )

        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToExec[11],
            {
                command: `git rm eslint.config.mjs`,
                options: { cwd: this.packageDir },
            },
            'Did not delete old eslint.config.mjs!'
        )
    }

    @test()
    protected static async thenInstallsNewEslintConfigJs() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[5],
            {
                file: this.eslintConfigJsPath,
                data: this.eslintConfigFile,
                options: { encoding: 'utf-8' },
            },
            'Did not install eslint.config.js!'
        )
    }

    @test()
    protected static async thenCommitsInstallEslintConfigFile() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[8],
            {
                commitMessage: `patch: install eslint.config.js (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit install eslint.config.js changes!'
        )
    }

    @test()
    protected static async thenInstallsPrettierConfigFile() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[6],
            {
                file: this.prettierConfigPath,
                data: this.prettierConfigFile,
                options: { encoding: 'utf-8' },
            },
            'Did not install prettier.config.js!'
        )
    }

    @test()
    protected static async thenCommitsInstallPrettierConfigFile() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[9],
            {
                commitMessage: `patch: install prettier.config.js (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit install prettier.config.js changes!'
        )
    }

    @test()
    protected static async thenInstallsSettingsJsonFile() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[7],
            {
                file: this.settingsJsonPath,
                data: this.settingsJsonFile,
                options: { encoding: 'utf-8' },
            },
            'Did not install settings.json!'
        )
    }

    @test()
    protected static async thenCommitsInstallSettingsJsonFile() {
        this.setShouldInstallDevDeps()
        await this.run()

        assert.isEqualDeep(
            FakeAutocommit.callsToConstructor[10],
            {
                commitMessage: `patch: install settings.json (@neurodevs/meta-node: ${this.metaNodeVersion})`,
                cwd: this.packageDir,
            },
            'Did not commit install settings.json changes!'
        )
    }

    @test()
    protected static async lastlyOpensVscodeAtEnd() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[11],
            { command: 'code .', options: { cwd: this.packageDir } },
            'Did not open vscode at end!'
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
    protected static async doesNotSpruceCreateModuleIfDone() {
        await this.runTwice()

        assert.isEqual(
            callsToExec.filter((call) => call?.command === this.createModuleCmd)
                .length,
            1,
            'Did not call spruce create.module once!'
        )
    }

    @test()
    protected static async doesNotRunSetupVscodeIfDone() {
        await this.runTwice()

        assert.isEqual(
            callsToExec.filter((call) => call?.command === this.setupVscodeCmd)
                .length,
            1,
            'Did not call spruce setup.vscode once!'
        )
    }

    @test()
    protected static async doesNotCommitCreatePackageIfDone() {
        await this.runTwice()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.filter(
                (call) =>
                    call?.commitMessage ===
                    `patch: create package (@neurodevs/meta-node: ${this.metaNodeVersion})`
            ).length,
            1,
            'Did not commit create package changes once!'
        )
    }

    @test()
    protected static async doesNotCommitUpdatePackageIfDone() {
        await this.runTwice()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.filter(
                (call) =>
                    call?.commitMessage ===
                    `patch: update package.json (@neurodevs/meta-node: ${this.metaNodeVersion})`
            ).length,
            1,
            'Did not commit update package changes once!'
        )
    }

    @test()
    protected static async doesNotCommitUpdateGitignoreIfDone() {
        await this.runTwice()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.filter(
                (call) =>
                    call?.commitMessage ===
                    `patch: add build dir to gitignore (@neurodevs/meta-node: ${this.metaNodeVersion})`
            ).length,
            1,
            'Did not commit gitignore changes once!'
        )
    }

    @test()
    protected static async doesNotCommitUpdateTsconfigIfDone() {
        await this.runTwice()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.filter(
                (call) =>
                    call?.commitMessage ===
                    `patch: update tsconfig (@neurodevs/meta-node: ${this.metaNodeVersion})`
            ).length,
            1,
            'Did not commit tsconfig changes once!'
        )
    }

    @test()
    protected static async doesNotCommitSetupVscodeIfDone() {
        await this.runTwice()

        assert.isEqual(
            FakeAutocommit.callsToConstructor.filter(
                (call) =>
                    call?.commitMessage ===
                    `patch: setup vscode (@neurodevs/meta-node: ${this.metaNodeVersion})`
            ).length,
            1,
            'Did not commit vscode changes once!'
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
    protected static async doesNotUpdateTasksJsonIfAlreadyDone() {
        await this.runTwice()

        assert.isEqualDeep(
            callsToWriteFile.filter((call) => call.file === this.tasksJsonPath)
                .length,
            1,
            'Did not update tasks.json once!'
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
            this.originalPackageJson.replace('@neurodevs/generate-id', '')
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
    protected static async doesNotRemoveEslintConfigMjsIfNotExists() {
        setPathShouldExist(this.eslintConfigMjsPath, false)
        await this.run()

        const calls = callsToExec.filter(
            (call) => call?.command === `git rm eslint.config.mjs`
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not remove eslint.config.mjs if it does not exist!'
        )
    }

    @test()
    protected static async doesNotInstallEslintConfigFileIfExists() {
        setPathShouldExist(this.eslintConfigJsPath, true)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.eslintConfigJsPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install eslint.config.js if already exists!'
        )
    }

    @test()
    protected static async doesNotInstallPrettierConfigFileIfExists() {
        setPathShouldExist(this.prettierConfigPath, true)

        await this.run()

        const calls = callsToWriteFile.filter(
            (call) => call.file === this.prettierConfigPath
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install prettier.config.js if already exists!'
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

        setFakeReadFileResult(this.packageJsonPath, this.updatedPackageJson)
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

    private static setShouldInstallDevDeps() {
        setFakeExecResult(this.checkGenerateIdVersionCmd, {
            stdout: '0.0.1',
        } as unknown as ChildProcess)
    }

    private static get scopedPackageName() {
        return `@${this.npmNamespace}/${this.packageName}`
    }

    private static get createModuleCmd() {
        return `spruce create.module --name "${this.packageName}" --destination "." --description "${this.description}"`
    }

    private static orderJsonKeys(
        json: Record<string, unknown>,
        keyOrder: string[]
    ) {
        const ordered: Record<string, any> = {}

        for (const key of keyOrder) {
            if (key in json) {
                ordered[key] = json[key]
            }
        }

        const remainingKeys = Object.keys(json)
            .filter((k) => !keyOrder.includes(k))
            .sort()

        for (const key of remainingKeys) {
            ordered[key] = json[key]
        }

        return ordered
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
    }

    private static fakeReadFile() {
        NpmAutopackage.readFile = fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()

        setFakeReadFileResult(this.packageJsonPath, this.originalPackageJson)

        setFakeReadFileResult(
            this.tasksJsonPath,
            JSON.stringify(this.originalTasksJson)
        )

        setFakeReadFileResult(
            this.tsconfigPath,
            JSON.stringify(this.originalTsconfig)
        )

        setFakeReadFileResult(this.gitignorePath, this.originalGitignore)
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
    }

    private static get reposUrl() {
        return `https://api.github.com/repos/${this.gitNamespace}/${this.packageName}`
    }

    private static get orgsUrl() {
        return `https://api.github.com/orgs/${this.gitNamespace}/repos`
    }

    private static get originalPackageJson() {
        return JSON.stringify({
            name: this.packageName,
            description: 'Old description',
            dependencies: this.dependencies,
            devDependencies: {
                '@neurodevs/generate-id': '^1.0.0',
                '@neurodevs/node-tdd': '^1.0.0',
                '@neurodevs/eslint-config-ndx': '^1.0.0',
                '@neurodevs/prettier-config-ndx': '^1.0.0',
            },
        })
    }

    private static get updatedPackageJson() {
        return JSON.stringify({
            ...JSON.parse(this.originalPackageJson),
            name: this.scopedPackageName,
            description: this.description,
            type: 'module',
            keywords: this.keywords,
            license: this.license,
            author: this.author,
            main: 'build/index.js',
            homepage: `https://github.com/${this.gitNamespace}/${this.packageName}`,
            repository: {
                type: 'git',
                url: `git+https://github.com/${this.gitNamespace}/${this.packageName}.git`,
            },
            bugs: {
                url: `https://github.com/${this.gitNamespace}/${this.packageName}/issues`,
            },
            dependencies: this.dependencies,
        })
    }

    private static get originalTsconfig(): TsConfig {
        return {
            compilerOptions: {
                lib: [this.customLib],
                types: [this.customType],
            },
            include: [this.customInclude],
            customOption: this.customOption,
        }
    }

    private static get updatedTsconfig() {
        return {
            ...this.originalTsconfig,
            compilerOptions: {
                module: 'nodenext',
                moduleResolution: 'nodenext',
                target: 'ES2022',
                lib: [this.customLib, 'ES2022'],
                types: [this.customType, 'node'],
                baseUrl: 'src',
                outDir: 'build',
                sourceMap: false,
                strict: true,
                noImplicitAny: true,
                noImplicitReturns: true,
                noUnusedLocals: true,
                forceConsistentCasingInFileNames: true,
                declaration: true,
                skipLibCheck: true,
                esModuleInterop: true,
                moduleDetection: 'force',
                allowJs: true,
                resolveJsonModule: true,
                experimentalDecorators: true,
            },
            include: [this.customInclude, './src/*.ts', './src/**/*.ts'],
        }
    }

    private static originalTasksJson = {
        [this.randomId]: this.randomId,
        tasks: [
            {
                [this.randomId]: this.randomId,
            },
        ],
        inputs: [
            {
                [this.randomId]: this.randomId,
            },
        ],
    }

    private static get updatedTasksJson() {
        return JSON.stringify(
            {
                ...this.originalTasksJson,
                tasks: [
                    ...this.originalTasksJson.tasks,
                    {
                        label: 'ndx',
                        type: 'shell',
                        command: 'ndx ${input:ndxCommand}',
                        problemMatcher: [],
                        presentation: {
                            reveal: 'always',
                            focus: true,
                            panel: 'new',
                            clear: false,
                        },
                    },
                ],
                inputs: [
                    ...this.originalTasksJson.inputs,
                    {
                        id: 'ndxCommand',
                        description: 'ndx command',
                        default: 'create.module',
                        type: 'promptString',
                    },
                ],
            },
            null,
            4
        )
    }

    private static NpmAutopackage(options?: Partial<AutopackageOptions>) {
        return NpmAutopackage.Create({ ...this.defaultOptions, ...options })
    }
}
