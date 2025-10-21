import { ChildProcess, exec as execSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { promisify } from 'util'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import {
    callsToChdir,
    callsToExec,
    callsToFetch,
    callsToReadFile,
    callsToWriteFile,
    fakeChdir,
    fakeExec,
    fakeFetch,
    fakePathExists,
    fakeReadFile,
    fakeWriteFile,
    resetCallsToChdir,
    resetCallsToExec,
    resetCallsToFetch,
    resetCallsToPathExists,
    resetCallsToReadFile,
    resetCallsToWriteFile,
    setFakeExecResult,
    setFakeFetchResponse,
    setFakeReadFileResult,
    setPathShouldExist,
} from '@neurodevs/fake-node-core'
import NpmAutopackage, {
    Autopackage,
    AutopackageOptions,
} from '../../impl/NpmAutopackage'
import AbstractPackageTest from '../AbstractPackageTest'

const exec = promisify(execSync)

export default class NpmAutopackageTest extends AbstractPackageTest {
    private static instance: Autopackage

    protected static async beforeEach() {
        await super.beforeEach()

        this.fakeChdir()
        this.fakeExec()
        this.fakePathExists()
        this.fakeFetch()
        this.fakeReadFile()
        this.fakeWriteFile()

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
                        description: this.packageDescription,
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
    protected static async secondChdirToInstallDir() {
        await this.run()

        assert.isEqual(
            callsToChdir[0],
            this.installDir,
            'Did not change to installDir!'
        )
    }

    @test()
    protected static async thirdGitClone() {
        await this.run()

        assert.isEqual(
            callsToExec[0],
            `git clone https://github.com/${this.gitNamespace}/${this.packageName}.git`,
            'Did not call git clone!'
        )
    }

    @test()
    protected static async fourthSpruceCreateModule() {
        await this.run()

        assert.isEqual(
            callsToExec[2],
            this.createModuleCmd,
            'Did not call "spruce create.module"!'
        )
    }

    @test()
    protected static async fifthCommitCreatePackage() {
        await this.run()

        assert.isEqualDeep(
            callsToExec.slice(3, 6),
            [
                'git add .',
                `git commit -m "patch: create package (@neurodevs/meta-node: ${this.metaNodeVersion})"`,
                'git push',
            ],
            'Did not commit create package changes!'
        )
    }

    @test()
    protected static async sixthChdirToPackageDir() {
        await this.run()

        assert.isEqual(
            callsToChdir[1],
            this.packageDir,
            'Did not change to packageDir!'
        )
    }

    @test()
    protected static async seventhReadPackageJson() {
        await this.run()

        assert.isEqualDeep(callsToReadFile[1], {
            path: this.packageJsonPath,
            options: { encoding: 'utf-8' },
        })
    }

    @test()
    protected static async eighthUpdatePackageJson() {
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
    protected static async ninthCommitUpdatePackage() {
        await this.run()

        assert.isEqualDeep(
            callsToExec.slice(6, 9),
            [
                'git add .',
                `git commit -m "patch: update package.json (@neurodevs/meta-node: ${this.metaNodeVersion})"`,
                'git push',
            ],
            'Did not commit update package changes!'
        )
    }

    @test()
    protected static async tenthAddBuildDirToGitignore() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[1],
            {
                file: this.gitignorePath,
                data: this.buildDirGitignorePattern,
                options: { encoding: 'utf-8', flag: 'a' },
            },
            'Did not update .gitignore as expected!'
        )
    }

    @test()
    protected static async eleventhCommitUpdateGitignore() {
        await this.run()

        assert.isEqualDeep(
            callsToExec.slice(9, 12),
            [
                'git add .',
                `git commit -m "patch: add build dir to gitignore (@neurodevs/meta-node: ${this.metaNodeVersion})"`,
                'git push',
            ],
            'Did not commit .gitignore changes!'
        )
    }

    @test()
    protected static async twelfthSpruceSetupVscode() {
        await this.run()

        assert.isEqual(
            callsToExec[12],
            this.setupVscodeCmd,
            'Did not call "spruce setup.vscode"!'
        )
    }

    @test()
    protected static async thirteenthCommitVscodeChanges() {
        await this.run()

        assert.isEqualDeep(
            callsToExec.slice(13, 16),
            [
                'git add .',
                `git commit -m "patch: setup vscode (@neurodevs/meta-node: ${this.metaNodeVersion})"`,
                'git push',
            ],
            'Did not commit vscode changes!'
        )
    }

    @test()
    protected static async fourteenthUpdatesVscodeTasksJson() {
        await this.run()

        assert.isEqualDeep(callsToWriteFile[2], {
            file: this.tasksJsonPath,
            data: this.updatedTasksJson,
            options: { encoding: 'utf-8' },
        })
    }

    @test()
    protected static async fifteenthCommitsUpdateVscodeTasksJson() {
        await this.run()

        assert.isEqualDeep(
            callsToExec.slice(16, 19),
            [
                'git add .',
                `git commit -m "patch: update vscode tasks.json (@neurodevs/meta-node: ${this.metaNodeVersion})"`,
                'git push',
            ],
            'Did not commit updated vscode tasks.json changes!'
        )
    }

    @test()
    protected static async sixteenthInstallsDefaultDevDependencies() {
        await this.run()

        assert.isEqual(
            callsToExec[20],
            'yarn add -D @neurodevs/generate-id@latest',
            'Did not install default devDependencies!'
        )
    }

    @test()
    protected static async seventeenthCommitsInstallDefaultDevDependencies() {
        await this.run()

        assert.isEqualDeep(
            callsToExec.slice(21, 24),
            [
                'git add .',
                `git commit -m "patch: install default devDependencies (@neurodevs/meta-node: ${this.metaNodeVersion})"`,
                'git push',
            ],
            'Did not commit install devDependencies changes!'
        )
    }

    @test()
    protected static async lastlyOpensVscodeAtEnd() {
        await this.run()

        assert.isEqual(callsToExec[24], 'code .', 'Did not open vscode at end!')
    }

    @test()
    protected static async doesNotCreateRepoInGithubOrgIfDone() {
        const fakeResponse = new Response(null, {
            status: 200,
            statusText: 'OK',
        })

        setFakeFetchResponse(this.reposUrl, fakeResponse)

        await this.createAndRunAutopackage()

        const numCalls = callsToFetch.filter(
            (call) => call.input === this.orgsUrl
        ).length

        assert.isEqual(numCalls, 0, 'Should not have created repo!')
    }

    @test()
    protected static async doesNotCloneRepoIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            callsToExec.filter(
                (cmd) =>
                    cmd ===
                    `git clone https://github.com/${this.gitNamespace}/${this.packageName}.git`
            ).length,
            1,
            'Did not clone repo once!'
        )
    }

    @test()
    protected static async doesNotSpruceCreateModuleIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            callsToExec.filter((cmd) => cmd === this.createModuleCmd).length,
            1,
            'Did not call spruce create.module once!'
        )
    }

    @test()
    protected static async doesNotRunSetupVscodeIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            callsToExec.filter((cmd) => cmd === this.setupVscodeCmd).length,
            1,
            'Did not call spruce setup.vscode once!'
        )
    }

    @test()
    protected static async doesNotCommitCreatePackageIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            callsToExec.filter(
                (cmd) =>
                    cmd ===
                    `git commit -m "patch: create package (@neurodevs/meta-node: ${this.metaNodeVersion})"`
            ).length,
            1,
            'Did not commit create package changes once!'
        )
    }

    @test()
    protected static async doesNotCommitUpdatePackageIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            callsToExec.filter(
                (cmd) =>
                    cmd ===
                    `git commit -m "patch: update package.json (@neurodevs/meta-node: ${this.metaNodeVersion})"`
            ).length,
            1,
            'Did not commit update package changes once!'
        )
    }

    @test()
    protected static async doesNotCommitUpdateGitignoreIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            callsToExec.filter(
                (cmd) =>
                    cmd ===
                    `git commit -m "patch: add build dir to gitignore (@neurodevs/meta-node: ${this.metaNodeVersion})"`
            ).length,
            1,
            'Did not commit gitignore changes once!'
        )
    }

    @test()
    protected static async doesNotCommitSetupVscodeIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            callsToExec.filter(
                (cmd) =>
                    cmd ===
                    `git commit -m "patch: setup vscode (@neurodevs/meta-node: ${this.metaNodeVersion})"`
            ).length,
            1,
            'Did not commit vscode changes once!'
        )
    }

    @test()
    protected static async doesNotOverrideOriginalDependencies() {
        await this.createAndRunAutopackage()

        assert.isEqualDeep(
            JSON.parse(callsToWriteFile[0]?.data).dependencies,
            this.dependencies,
            'Did not update package.json as expected!'
        )
    }

    @test()
    protected static async doesNotUpdateTasksJsonIfAlreadyDone() {
        setFakeReadFileResult(this.tasksJsonPath, this.updatedTasksJson)

        await this.createAndRunAutopackage()

        assert.isEqualDeep(
            callsToWriteFile.filter((call) => call.file === this.tasksJsonPath)
                .length,
            0,
            'Did not update tasks.json once!'
        )
    }

    @test()
    protected static async doesNotOpenVscodeIfNotCloned() {
        setPathShouldExist(this.packageName, true)

        await this.createAndRunAutopackage()

        assert.isFalse(
            callsToExec.includes('code .'),
            'Should not open vscode if not cloned!'
        )
    }
    @test()
    protected static async doesNotInstallDevDependenciesIfLatest() {
        setFakeExecResult(this.checkGenerateIdVersionCmd, {
            stdout: '1.0.0',
        } as unknown as ChildProcess)

        await this.createAndRunAutopackage()

        const calls = callsToExec.filter(
            (cmd) => cmd === 'yarn add -D @neurodevs/generate-id@latest'
        )

        assert.isEqual(
            calls.length,
            0,
            'Should not install default devDependencies if already installed!'
        )
    }

    @test()
    protected static async doesNotThrowIfGenerateIdNotInPackageJson() {
        setFakeReadFileResult(
            this.packageJsonPath,
            this.originalPackageJson.replace('@neurodevs/generate-id', '')
        )

        await this.createAndRunAutopackage()
    }

    private static async run() {
        await this.instance.run()
    }

    private static async createAndRunAutopackage() {
        const instance = this.NpmAutopackage()
        await instance.run()
    }

    private static get scopedPackageName() {
        return `@${this.gitNamespace}/${this.packageName}`
    }

    private static get packageDir() {
        return this.packageName
    }

    private static readonly packageJsonPath = 'package.json'
    private static readonly gitignorePath = '.gitignore'
    private static readonly buildDirGitignorePattern = '\nbuild/\n'

    private static get createModuleCmd() {
        return `spruce create.module --name "${this.packageName}" --destination "${this.packageDir}" --description "${this.packageDescription}"`
    }

    private static readonly setupVscodeCmd = 'spruce setup.vscode --all true'

    private static readonly checkGenerateIdVersionCmd = `yarn info @neurodevs/generate-id version --silent`

    private static readonly yarnGlobalDirCmd = 'yarn global dir'
    private static readonly fakeGlobalRoot = generateId()

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

    private static fakeChdir() {
        NpmAutopackage.chdir = fakeChdir
        resetCallsToChdir()
    }

    private static fakeExec() {
        NpmAutopackage.exec = fakeExec as unknown as typeof exec
        resetCallsToExec()

        setFakeExecResult(this.yarnGlobalDirCmd, {
            stdout: this.fakeGlobalRoot,
        } as unknown as ChildProcess)

        setFakeReadFileResult(
            path.join(
                this.fakeGlobalRoot,
                'node_modules',
                '@neurodevs',
                'meta-node',
                'package.json'
            ),
            JSON.stringify({ version: this.metaNodeVersion })
        )
    }

    private static fakePathExists() {
        NpmAutopackage.pathExists = fakePathExists
        resetCallsToPathExists()
    }

    private static fakeFetch() {
        NpmAutopackage.fetch = fakeFetch as unknown as typeof fetch
        resetCallsToFetch()
    }

    private static fakeReadFile() {
        NpmAutopackage.readFile = fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()

        setFakeReadFileResult(this.packageJsonPath, this.originalPackageJson)

        setFakeReadFileResult(
            this.tasksJsonPath,
            JSON.stringify(this.originalTasksJson)
        )
    }

    private static fakeWriteFile() {
        NpmAutopackage.writeFile = fakeWriteFile as unknown as typeof writeFile
        resetCallsToWriteFile()
    }

    private static fakeFetchForRepoNotFound() {
        const fakeResponse = new Response(null, {
            status: 404,
            statusText: 'Not Found',
        })

        setFakeFetchResponse(this.reposUrl, fakeResponse)
    }

    private static readonly packageName = generateId()
    private static readonly packageDescription = generateId()
    private static readonly gitNamespace = generateId()
    private static readonly npmNamespace = generateId()
    private static readonly installDir = generateId()
    private static readonly keywords = [generateId(), generateId()]
    private static readonly license = generateId()
    private static readonly author = generateId()

    private static readonly githubToken = generateId()
    private static readonly metaNodeVersion = generateId()
    private static readonly randomId = generateId()

    private static get reposUrl() {
        return `https://api.github.com/repos/${this.gitNamespace}/${this.packageName}`
    }

    private static get orgsUrl() {
        return `https://api.github.com/orgs/${this.gitNamespace}/repos`
    }

    private static readonly dependencies = {
        [generateId()]: generateId(),
        [generateId()]: generateId(),
    }

    private static get originalPackageJson() {
        return JSON.stringify({
            name: this.packageName,
            description: 'Old description',
            dependencies: this.dependencies,
            devDependencies: {
                '@neurodevs/generate-id': '^1.0.0',
            },
        })
    }

    private static get updatedPackageJson() {
        return JSON.stringify({
            ...JSON.parse(this.originalPackageJson),
            name: this.scopedPackageName,
            description: this.packageDescription,
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

    private static readonly tasksJsonPath = '.vscode/tasks.json'

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

    private static readonly defaultOptions = {
        name: this.packageName,
        description: this.packageDescription,
        gitNamespace: this.gitNamespace,
        npmNamespace: this.npmNamespace,
        installDir: this.installDir,
        keywords: this.keywords,
        license: this.license,
        author: this.author,
    }

    private static NpmAutopackage(options?: Partial<AutopackageOptions>) {
        return NpmAutopackage.Create({ ...this.defaultOptions, ...options })
    }
}
