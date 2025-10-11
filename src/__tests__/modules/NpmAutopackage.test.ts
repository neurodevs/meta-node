import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import NpmAutopackage, {
    Autopackage,
    AutopackageOptions,
} from '../../modules/NpmAutopackage'

export default class NpmAutopackageTest extends AbstractSpruceTest {
    private static instance: Autopackage

    protected static async beforeEach() {
        await super.beforeEach()

        this.fakeExecToPreventActual()
        this.fakeChdirToPreventActual()
        this.fakeFetch()

        process.env.GITHUB_TOKEN = this.githubToken

        this.instance = await this.NpmAutopackage()
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
                await this.NpmAutopackage()
            },
            'Please set process.env.GITHUB_TOKEN!',
            'Did not throw with missing process.env.GITHUB_TOKEN!'
        )
    }

    @test()
    protected static async firstCreatesRepoInGithubOrg() {
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
    protected static async secondCallsChdirToInstallDir() {
        assert.isEqual(
            this.callsToChdir[0],
            this.installDir,
            'Did not change to installDir!'
        )
    }

    @test()
    protected static async thirdCallsGitClone() {
        assert.isEqual(
            this.callsToExecSync[0],
            `git clone https://github.com/${this.gitNamespace}/${this.packageName}.git`,
            'Did not call git clone!'
        )
    }

    @test()
    protected static async fourthCallsSpruceCreateModule() {
        assert.isEqual(
            this.callsToExecSync[1],
            `spruce create.module --name "${this.packageName}" --destination "${this.installDir}/${this.packageName}" --description "${this.packageDescription}"`,
            'Did not call "spruce create.module"!'
        )
    }

    @test()
    protected static async fifthCallsChdirToPackageDir() {
        assert.isEqual(
            this.callsToChdir[1],
            `${this.installDir}/${this.packageName}`,
            'Did not change to packageDir!'
        )
    }

    @test()
    protected static async sixthCommitsForCreatePackage() {
        assert.isEqualDeep(
            this.callsToExecSync.slice(2, 5),
            ['git add .', 'git commit -m "patch: create package"', 'git push'],
            'Did not commit create package changes!'
        )
    }

    @test()
    protected static async seventhCallsSpruceSetupVscode() {
        assert.isEqual(
            this.callsToExecSync[5],
            'spruce setup.vscode --all true',
            'Did not call "spruce setup.vscode"!'
        )
    }

    @test()
    protected static async eighthGitCommitsVscodeChanges() {
        assert.isEqualDeep(
            this.callsToExecSync.slice(6, 9),
            ['git add .', 'git commit -m "patch: setup vscode"', 'git push'],
            'Did not commit vscode changes!'
        )
    }

    private static fakeExecToPreventActual() {
        // @ts-ignore
        NpmAutopackage.execSync = (cmd: string) => {
            this.callsToExecSync.push(cmd)
        }
        this.callsToExecSync = []
    }

    private static fakeChdirToPreventActual() {
        NpmAutopackage.chdir = (dir: string) => {
            this.callsToChdir.push(dir)
        }
        this.callsToChdir = []
    }

    private static fakeFetch() {
        // @ts-ignore
        NpmAutopackage.fetch = async (url: string, init: RequestInit) => {
            this.callsToFetch.push({ url, init })
        }
    }

    private static callsToExecSync: string[] = []
    private static callsToChdir: string[] = []
    private static callsToFetch: { url: string; init: RequestInit }[] = []

    private static readonly packageName = generateId()
    private static readonly packageDescription = generateId()
    private static readonly gitNamespace = generateId()
    private static readonly npmNamespace = generateId()
    private static readonly installDir = generateId()

    private static readonly githubToken = generateId()

    private static readonly defaultOptions = {
        name: this.packageName,
        description: this.packageDescription,
        gitNamespace: this.gitNamespace,
        npmNamespace: this.npmNamespace,
        installDir: this.installDir,
    }

    private static NpmAutopackage(options?: Partial<AutopackageOptions>) {
        return NpmAutopackage.Create({ ...this.defaultOptions, ...options })
    }
}
