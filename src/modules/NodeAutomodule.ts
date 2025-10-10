import pathExists from './pathExists'

export default class NodeAutomodule implements Automodule {
    public static Class?: AutomoduleConstructor
    public static pathExists = pathExists

    private testSaveDir: string

    protected constructor(options: AutomoduleOptions) {
        const { testSaveDir } = options

        this.testSaveDir = testSaveDir
    }

    public static Create(options: AutomoduleOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        const testDirExists = await this.checkIfTestDirExists()

        if (!testDirExists) {
            throw new Error(`testSaveDir does not exist: ${this.testSaveDir}!`)
        }
    }

    private async checkIfTestDirExists() {
        return await NodeAutomodule.pathExists(this.testSaveDir)
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
}
