import pathExists from './pathExists'

export default class NodeAutomodule implements Automodule {
    public static Class?: AutomoduleConstructor
    public static pathExists = pathExists

    private testSaveDir: string
    private moduleSaveDir: string

    protected constructor(options: AutomoduleOptions) {
        const { testSaveDir, moduleSaveDir } = options

        this.testSaveDir = testSaveDir
        this.moduleSaveDir = moduleSaveDir
    }

    public static Create(options: AutomoduleOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        await this.throwIfTestDirDoesNotExist()
        await this.throwIfModuleDirDoesNotExist()
    }

    private async throwIfTestDirDoesNotExist() {
        const testDirExists = await this.pathExists(this.testSaveDir)

        if (!testDirExists) {
            throw new Error(`testSaveDir does not exist: ${this.testSaveDir}!`)
        }
    }

    private async throwIfModuleDirDoesNotExist() {
        const moduleDirExists = await this.pathExists(this.moduleSaveDir)

        if (!moduleDirExists) {
            throw new Error(
                `moduleSaveDir does not exist: ${this.moduleSaveDir}!`
            )
        }
    }

    private get pathExists() {
        return NodeAutomodule.pathExists
    }
}

export interface Automodule {
    run(): Promise<void>
}

export type AutomoduleConstructor = new (
    options: AutomoduleOptions
) => Automodule

export interface AutomoduleOptions {
    testSaveDir: string
    moduleSaveDir: string
}
