import { writeFile } from 'fs/promises'
import { pathExists } from 'fs-extra'
import { Automodule, BaseAutomoduleOptions } from '../types'

export default abstract class AbstractAutomodule implements Automodule {
    public static pathExists = pathExists
    public static writeFile = writeFile

    protected testSaveDir: string
    protected moduleSaveDir: string
    protected fakeSaveDir: string

    protected testFileName!: string
    protected testFileContent!: string

    protected constructor(options: BaseAutomoduleOptions) {
        const { testSaveDir, moduleSaveDir, fakeSaveDir } = options

        this.testSaveDir = testSaveDir
        this.moduleSaveDir = moduleSaveDir
        this.fakeSaveDir = fakeSaveDir
    }

    public abstract run(): Promise<void>

    protected async runAbstract(options: AbstractAutomoduleRunOptions) {
        const { testFileName, testFileContent } = options

        this.testFileName = testFileName
        this.testFileContent = testFileContent

        await this.throwIfDirectoriesDoNotExist()

        await this.createTestFile()
    }

    private async throwIfDirectoriesDoNotExist() {
        await this.throwIfTestDirDoesNotExist()
        await this.throwIfModuleDirDoesNotExist()
        await this.throwIfFakeDirDoesNotExist()
    }

    private async throwIfTestDirDoesNotExist() {
        const testDirExists = await this.pathExists(this.testSaveDir)

        if (!testDirExists) {
            this.throw(`testSaveDir does not exist: ${this.testSaveDir}!`)
        }
    }

    private async throwIfModuleDirDoesNotExist() {
        const moduleDirExists = await this.pathExists(this.moduleSaveDir)

        if (!moduleDirExists) {
            this.throw(`moduleSaveDir does not exist: ${this.moduleSaveDir}!`)
        }
    }

    private async throwIfFakeDirDoesNotExist() {
        const fakeDirExists = await this.pathExists(this.fakeSaveDir)

        if (!fakeDirExists) {
            this.throw(`fakeSaveDir does not exist: ${this.fakeSaveDir}!`)
        }
    }

    private async createTestFile() {
        await this.writeFile(this.testFilePath, this.testFileContent)
    }

    private get testFilePath() {
        return `${this.testSaveDir}/${this.testFileName}`
    }

    private throw(err: string) {
        throw new Error(err)
    }

    private get pathExists() {
        return AbstractAutomodule.pathExists
    }

    protected get writeFile() {
        return AbstractAutomodule.writeFile
    }
}

export interface AbstractAutomoduleOptions extends BaseAutomoduleOptions {
    testFileName: string
    testFileContent: string
}

export interface AbstractAutomoduleRunOptions {
    testFileName: string
    testFileContent: string
}
