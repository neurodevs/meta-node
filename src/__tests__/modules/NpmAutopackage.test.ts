import { readFile, writeFile } from 'fs/promises'
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
    setFakeReadFileResult,
} from '@neurodevs/fake-node-core'
import NpmAutopackage, {
    Autopackage,
    AutopackageOptions,
} from '../../modules/NpmAutopackage'
import AbstractPackageTest from '../AbstractPackageTest'

export default class NpmAutopackageTest extends AbstractPackageTest {
    private static instance: Autopackage

    protected static async beforeEach() {
        await super.beforeEach()

        this.fakeChdir()
        this.fakeExec()
        this.fakeExistsSync()
        this.fakeFetch()
        this.fakeReadFile()
        this.fakeWriteFile()

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
                passedUrl: callsToFetch[0]?.input,
                passedInit: callsToFetch[0]?.init,
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
            callsToExec[1],
            this.createModuleCmd,
            'Did not call "spruce create.module"!'
        )
    }

    @test()
    protected static async fifthCommitCreatePackage() {
        await this.run()

        assert.isEqualDeep(
            callsToExec.slice(2, 5),
            ['git add .', 'git commit -m "patch: create package"', 'git push'],
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

        assert.isEqualDeep(callsToReadFile[0], {
            path: this.packageJsonPath,
            options: { encoding: 'utf-8' },
        })
    }

    @test()
    protected static async eighthUpdatePackageJson() {
        await this.run()

        const actual = callsToWriteFile[0]

        const ordered = this.orderJsonKeys(JSON.parse(this.updatedJsonFile), [
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
        ])

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
            callsToExec.slice(5, 8),
            ['git add .', 'git commit -m "patch: update package"', 'git push'],
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
            callsToExec.slice(8, 11),
            [
                'git add .',
                'git commit -m "patch: add build dir to gitignore"',
                'git push',
            ],
            'Did not commit .gitignore changes!'
        )
    }

    @test()
    protected static async twelfthSpruceSetupVscode() {
        await this.run()

        assert.isEqual(
            callsToExec[11],
            NpmAutopackageTest.setupVscodeCmd,
            'Did not call "spruce setup.vscode"!'
        )
    }

    @test()
    protected static async lastlyCommitVscodeChanges() {
        await this.run()

        assert.isEqualDeep(
            callsToExec.slice(12, 15),
            ['git add .', 'git commit -m "patch: setup vscode"', 'git push'],
            'Did not commit vscode changes!'
        )
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
                (cmd) => cmd === 'git commit -m "patch: create package"'
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
                (cmd) => cmd === 'git commit -m "patch: update package"'
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
                    cmd === 'git commit -m "patch: add build dir to gitignore"'
            ).length,
            1,
            'Did not commit gitignore changes once!'
        )
    }

    @test()
    protected static async doesNotCommitVscodeIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            callsToExec.filter(
                (cmd) => cmd === 'git commit -m "patch: setup vscode"'
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

    private static async run() {
        await this.instance.run()
    }

    private static async createAndRunAutopackage() {
        const instance = this.NpmAutopackage()
        await instance.run()
    }

    private static get scopedPackage() {
        return `${this.gitNamespace}/${this.packageName}`
    }

    private static get packageDir() {
        return `${this.installDir}/${this.packageName}`
    }

    private static get packageJsonPath() {
        return `${this.packageDir}/package.json`
    }

    private static get gitignorePath() {
        return `${this.packageDir}/.gitignore`
    }

    private static readonly buildDirGitignorePattern = '\nbuild/\n'

    private static get createModuleCmd() {
        return `spruce create.module --name "${this.packageName}" --destination "${this.packageDir}" --description "${this.packageDescription}"`
    }

    private static readonly setupVscodeCmd = 'spruce setup.vscode --all true'

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
        NpmAutopackage.exec = fakeExec
        resetCallsToExec()
    }

    private static fakeExistsSync() {
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

        setFakeReadFileResult(this.originalJsonFile)
    }

    private static fakeWriteFile() {
        NpmAutopackage.writeFile = fakeWriteFile as unknown as typeof writeFile
        resetCallsToWriteFile()
    }

    private static get originalJsonFile() {
        return JSON.stringify({
            name: this.packageName,
            description: 'Old description',
            dependencies: this.dependencies,
        })
    }

    private static readonly dependencies = {
        [generateId()]: generateId(),
        [generateId()]: generateId(),
    }

    private static get updatedJsonFile() {
        return JSON.stringify({
            ...JSON.parse(this.originalJsonFile),
            name: `@${this.scopedPackage}`,
            description: this.packageDescription,
            keywords: this.keywords,
            license: this.license,
            author: this.author,
            main: 'build/index.js',
            homepage: `https://github.com/${this.scopedPackage}`,
            repository: {
                type: 'git',
                url: `git+https://github.com/${this.scopedPackage}.git`,
            },
            bugs: {
                url: `https://github.com/${this.scopedPackage}/issues`,
            },
            dependencies: this.dependencies,
        })
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
