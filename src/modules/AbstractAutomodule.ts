import { Automodule, BaseAutomoduleOptions } from '../types'

export default abstract class AbstractAutomodule implements Automodule {
    protected testSaveDir: string
    protected moduleSaveDir: string
    protected fakeSaveDir: string
    protected pathExists: (path: string) => Promise<boolean>

    protected constructor(options: AbstractAutomoduleOptions) {
        const { testSaveDir, moduleSaveDir, fakeSaveDir, pathExists } = options

        this.testSaveDir = testSaveDir
        this.moduleSaveDir = moduleSaveDir
        this.fakeSaveDir = fakeSaveDir
        this.pathExists = pathExists
    }

    public abstract run(): Promise<void>

    protected async throwIfDirectoriesDoNotExist() {
        await this.throwIfTestDirDoesNotExist()
        await this.throwIfModuleDirDoesNotExist()
        await this.throwIfFakeDirDoesNotExist()
    }

    protected async throwIfTestDirDoesNotExist() {
        const testDirExists = await this.pathExists(this.testSaveDir)

        if (!testDirExists) {
            this.throw(`testSaveDir does not exist: ${this.testSaveDir}!`)
        }
    }

    protected async throwIfModuleDirDoesNotExist() {
        const moduleDirExists = await this.pathExists(this.moduleSaveDir)

        if (!moduleDirExists) {
            this.throw(`moduleSaveDir does not exist: ${this.moduleSaveDir}!`)
        }
    }

    protected async throwIfFakeDirDoesNotExist() {
        const fakeDirExists = await this.pathExists(this.fakeSaveDir)

        if (!fakeDirExists) {
            this.throw(`fakeSaveDir does not exist: ${this.fakeSaveDir}!`)
        }
    }

    protected throw(err: string) {
        throw new Error(err)
    }
}

export interface AbstractAutomoduleOptions extends BaseAutomoduleOptions {
    pathExists: (path: string) => Promise<boolean>
}
