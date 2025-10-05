import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import NpmAutopackage, {
    Autopackage,
    AutopackageOptions,
} from '../modules/NpmAutopackage'

export default class NpmAutopackageTest extends AbstractSpruceTest {
    private static instance: Autopackage

    protected static async beforeEach() {
        await super.beforeEach()

        this.fakeExecToPreventActual()
        this.fakeChdirToPreventActual()

        this.instance = await this.NpmAutopackage()
    }

    @test()
    protected static async createsNpmAutopackageInstance() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    @test()
    protected static async firstCallsChdirToInstallDir() {
        assert.isEqual(
            this.callsToChdir[0],
            this.installDir,
            'Should have changed dir!'
        )
    }

    @test()
    protected static async thenCallsSpruceCreateModule() {
        assert.isEqual(
            this.callsToExecSync[0],
            this.createModuleCmd,
            'Should have called "spruce create.module"!'
        )
    }

    @test()
    protected static async thenCallsChdirToNewlyCreatedDir() {
        assert.isEqual(
            this.callsToChdir[1],
            `${this.installDir}/${this.packageName}`,
            'Should have changed dir!'
        )
    }

    @test()
    protected static async thenSetsUpNewGitRepo() {
        assert.isEqualDeep(
            this.callsToExecSync.slice(1, 5),
            [
                'git init',
                'git add .',
                'git commit -m "patch: create module"',
                `git remote add origin "https://github.com/${this.gitNamespace}/${this.packageName}.git"`,
            ],
            'Should have called "git init"!'
        )
    }

    @test()
    protected static async thenCallsSpruceSetupVscode() {
        assert.isEqual(
            this.callsToExecSync[5],
            'spruce setup.vscode --all true',
            'Should have called "spruce setup.vscode"!'
        )
    }

    @test()
    protected static async thenGitCommitsVscodeChanges() {
        assert.isEqualDeep(
            this.callsToExecSync.slice(6, 8),
            ['git add .', 'git commit -m "patch: setup vscode"'],
            'Should have committed vscode changes!'
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

    private static callsToExecSync: string[] = []
    private static callsToChdir: string[] = []

    private static readonly packageName = generateId()
    private static readonly packageDescription = generateId()
    private static readonly gitNamespace = generateId()
    private static readonly npmNamespace = generateId()
    private static readonly installDir = generateId()

    private static readonly createModuleCmd = `spruce create.module --name "${this.packageName}" --destination "${this.installDir}/${this.packageName}" --description "${this.packageDescription}"`

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
