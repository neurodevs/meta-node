import { test, assert, generateId } from '@sprucelabs/test-utils'
import NpmAutopackage, {
    Autopackage,
    AutopackageOptions,
} from '../../modules/NpmAutopackage'
import AbstractPackageTest from '../AbstractPackageTest'

export default class NpmAutopackageTest extends AbstractPackageTest {
    private static instance: Autopackage

    private static callsToChdir: string[] = []
    private static callsToExecSync: string[] = []
    private static callsToExistsSync: string[] = []
    private static callsToFetch: { url: string; init: RequestInit }[] = []
    private static callsToReadFileSync: { path: string; options: any }[] = []
    private static callsToWriteFileSync: {
        path: string
        data: any
        options: any
    }[] = []

    protected static async beforeEach() {
        await super.beforeEach()

        this.fakeChdir()
        this.fakeExecSync()
        this.fakeExistsSync()
        this.fakeFetch()
        this.fakeReadFileSync()
        this.fakeWriteFileSync()

        process.env.GITHUB_TOKEN = this.githubToken

        this.instance = this.NpmAutopackage()
        await this.instance.run()
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
        assert.isEqualDeep(
            {
                passedUrl: this.callsToFetch[0]?.url,
                passedInit: this.callsToFetch[0]?.init,
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
        assert.isEqual(
            this.callsToChdir[0],
            this.installDir,
            'Did not change to installDir!'
        )
    }

    @test()
    protected static async thirdGitClone() {
        assert.isEqual(
            this.callsToExecSync[0],
            `git clone https://github.com/${this.gitNamespace}/${this.packageName}.git`,
            'Did not call git clone!'
        )
    }

    @test()
    protected static async fourthSpruceCreateModule() {
        assert.isEqual(
            this.callsToExecSync[1],
            this.createModuleCmd,
            'Did not call "spruce create.module"!'
        )
    }

    @test()
    protected static async fifthCommitCreatePackage() {
        assert.isEqualDeep(
            this.callsToExecSync.slice(2, 5),
            ['git add .', 'git commit -m "patch: create package"', 'git push'],
            'Did not commit create package changes!'
        )
    }

    @test()
    protected static async sixthChdirToPackageDir() {
        assert.isEqual(
            this.callsToChdir[1],
            this.packageDir,
            'Did not change to packageDir!'
        )
    }

    @test()
    protected static async seventhReadPackageJson() {
        assert.isEqualDeep(this.callsToReadFileSync[0], {
            path: this.packageJsonPath,
            options: { encoding: 'utf-8' },
        })
    }

    @test()
    protected static async eighthUpdatePackageJson() {
        const actual = this.callsToWriteFileSync[0]

        const expected = {
            path: this.packageJsonPath,
            data: this.orderJsonKeys(JSON.parse(this.updatedJsonFile), [
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
            ]),
            options: { encoding: 'utf-8' },
        }

        const normalize = (s: string) => s.replace(/\s+/g, '').trim()

        assert.isEqualDeep(
            {
                ...actual,
                data: normalize(actual.data),
            },
            {
                ...expected,
                data: normalize(expected.data),
            },
            'Did not update package.json as expected!'
        )
    }

    @test()
    protected static async ninthCommitUpdatePackage() {
        assert.isEqualDeep(
            this.callsToExecSync.slice(5, 8),
            ['git add .', 'git commit -m "patch: update package"', 'git push'],
            'Did not commit update package changes!'
        )
    }

    @test()
    protected static async tenthAddBuildDirToGitignore() {
        const actual = this.callsToWriteFileSync[1]

        const expected = {
            path: this.gitignorePath,
            data: '\nbuild/\n',
            options: { encoding: 'utf-8', flag: 'a' },
        }

        assert.isEqualDeep(
            actual,
            expected,
            'Did not update .gitignore as expected!'
        )
    }

    @test()
    protected static async eleventhCommitUpdateGitignore() {
        assert.isEqualDeep(
            this.callsToExecSync.slice(8, 11),
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
        assert.isEqual(
            this.callsToExecSync[11],
            NpmAutopackageTest.setupVscodeCmd,
            'Did not call "spruce setup.vscode"!'
        )
    }

    @test()
    protected static async lastlyCommitVscodeChanges() {
        assert.isEqualDeep(
            this.callsToExecSync.slice(12, 15),
            ['git add .', 'git commit -m "patch: setup vscode"', 'git push'],
            'Did not commit vscode changes!'
        )
    }

    @test()
    protected static async doesNotCloneRepoIfDone() {
        assert.isEqual(
            this.callsToExecSync.filter(
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
            this.callsToExecSync.filter((cmd) => cmd === this.createModuleCmd)
                .length,
            1,
            'Did not call spruce create.module once!'
        )
    }

    @test()
    protected static async doesNotRunSetupVscodeIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            this.callsToExecSync.filter((cmd) => cmd === this.setupVscodeCmd)
                .length,
            1,
            'Did not call spruce setup.vscode once!'
        )
    }

    @test()
    protected static async doesNotCommitCreatePackageIfDone() {
        await this.createAndRunAutopackage()

        assert.isEqual(
            this.callsToExecSync.filter(
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
            this.callsToExecSync.filter(
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
            this.callsToExecSync.filter(
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
            this.callsToExecSync.filter(
                (cmd) => cmd === 'git commit -m "patch: setup vscode"'
            ).length,
            1,
            'Did not commit vscode changes once!'
        )
    }

    @test()
    protected static async doesNotOverrideOriginalDependencies() {
        assert.isEqualDeep(
            JSON.parse(this.callsToWriteFileSync[0]?.data).dependencies,
            this.dependencies,
            'Did not update package.json as expected!'
        )
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

        return JSON.stringify(ordered)
    }

    private static fakeChdir() {
        NpmAutopackage.chdir = (dir: string) => {
            this.callsToChdir.push(dir)
        }
        this.callsToChdir = []
    }

    private static fakeExecSync() {
        // @ts-ignore
        NpmAutopackage.execSync = (cmd: string) => {
            this.callsToExecSync.push(cmd)
        }
        this.callsToExecSync = []
    }

    private static fakeExistsSync() {
        // @ts-ignore
        NpmAutopackage.existsSync = (path: string) => {
            if (this.callsToExistsSync.includes(path)) {
                this.callsToExistsSync.push(path)
                return true
            } else {
                this.callsToExistsSync.push(path)
                return false
            }
        }
        this.callsToExistsSync = []
    }

    private static fakeFetch() {
        // @ts-ignore
        NpmAutopackage.fetch = async (url: string, init: RequestInit) => {
            this.callsToFetch.push({ url, init })
        }
        this.callsToFetch = []
    }

    private static fakeReadFileSync() {
        // @ts-ignore
        NpmAutopackage.readFileSync = (path: string, options: any) => {
            this.callsToReadFileSync.push({ path, options })

            if (path === this.packageJsonPath) {
                if (
                    this.callsToReadFileSync.filter(
                        ({ path }) => path === this.packageJsonPath
                    ).length > 1
                ) {
                    return this.updatedJsonFile
                }
                return this.originalJsonFile
            } else if (path === this.gitignorePath) {
                if (
                    this.callsToReadFileSync.filter(
                        ({ path }) => path === this.gitignorePath
                    ).length > 1
                ) {
                    return 'node_modules/\n\nbuild/\n'
                }
                return 'node_modules/\n'
            }
            return ''
        }
        this.callsToReadFileSync = []
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

    private static fakeWriteFileSync() {
        // @ts-ignore
        NpmAutopackage.writeFileSync = (
            path: string,
            data: any,
            options: any
        ) => {
            this.callsToWriteFileSync.push({ path, data, options })
        }
        this.callsToWriteFileSync = []
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
