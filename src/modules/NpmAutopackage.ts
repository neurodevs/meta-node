import { execSync } from 'child_process'

export default class NpmAutopackage implements Autopackage {
    public static Class?: AutopackageConstructor
    public static chdir = process.chdir
    public static execSync = execSync

    private packageName: string
    private packageDescription: string
    private gitNamespace: string
    private installDir: string

    protected constructor(options: AutopackageOptions) {
        const { name, description, gitNamespace, installDir } = options

        this.packageName = name
        this.packageDescription = description
        this.gitNamespace = gitNamespace
        this.installDir = installDir
    }

    public static async Create(options: AutopackageOptions) {
        const instance = new (this.Class ?? this)(options)
        await instance.createPackage()

        return instance
    }

    public async createPackage() {
        this.execCreateModule()
        this.execGitSetup()
        this.execSetupVscode()
    }

    private execCreateModule() {
        this.chdirToInstallDir()
        this.exec(this.createModuleCmd)
    }

    private execGitSetup() {
        this.chdirToNewPackageDir()

        this.gitInit()
        this.gitAdd()
        this.gitCommitCreateModule()
        this.gitRemoteAddOrigin()
    }

    private gitInit() {
        this.exec(this.initCmd)
    }

    private gitAdd() {
        this.exec(this.addCmd)
    }

    private gitCommitCreateModule() {
        this.exec(this.commitCreateCmd)
    }

    private gitRemoteAddOrigin() {
        this.exec(this.addRemoteCmd)
    }

    private execSetupVscode() {
        this.exec(this.setupVscodeCmd)

        this.gitAdd()
        this.gitCommitSetupVscode()
    }

    private gitCommitSetupVscode() {
        this.exec(this.commitVscodeCmd)
    }

    private chdirToInstallDir() {
        this.chdir(this.installDir)
    }

    private chdirToNewPackageDir() {
        this.chdir(this.packageDir)
    }

    private get packageDir() {
        return `${this.installDir}/${this.packageName}`
    }

    private get chdir() {
        return NpmAutopackage.chdir
    }

    private get exec() {
        return NpmAutopackage.execSync
    }

    private get createModuleCmd() {
        return `spruce create.module --name "${this.packageName}" --destination "${this.installDir}/${this.packageName}" --description "${this.packageDescription}"`
    }

    private readonly initCmd = 'git init'
    private readonly addCmd = 'git add .'
    private readonly commitCreateCmd = 'git commit -m "patch: create module"'

    private get addRemoteCmd() {
        return `git remote add origin "https://github.com/${this.gitNamespace}/${this.packageName}.git"`
    }

    private readonly setupVscodeCmd = 'spruce setup.vscode --all true'
    private readonly commitVscodeCmd = 'git commit -m "patch: setup vscode"'
}

export interface Autopackage {
    createPackage(): Promise<void>
}

export interface AutopackageOptions {
    name: string
    description: string
    gitNamespace: string
    npmNamespace: string
    installDir: string
}

export type AutopackageConstructor = new () => Autopackage
