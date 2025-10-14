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
    protected moduleFileName!: string
    protected moduleFileContent!: string
    protected fakeFileName!: string
    protected fakeFileContent!: string

    protected constructor(options: BaseAutomoduleOptions) {
        const { testSaveDir, moduleSaveDir, fakeSaveDir } = options

        this.testSaveDir = testSaveDir
        this.moduleSaveDir = moduleSaveDir
        this.fakeSaveDir = fakeSaveDir
    }

    public abstract run(): Promise<void>

    protected async runAbstract(options: AbstractAutomoduleRunOptions) {
        const {
            testFileName,
            testFileContent,
            moduleFileName,
            moduleFileContent,
            fakeFileName,
            fakeFileContent,
        } = options

        this.testFileName = testFileName
        this.testFileContent = testFileContent
        this.moduleFileName = moduleFileName
        this.moduleFileContent = moduleFileContent
        this.fakeFileName = fakeFileName
        this.fakeFileContent = fakeFileContent

        await this.throwIfDirectoriesDoNotExist()

        await this.createTestFile()
        await this.createModuleFile()
        await this.createFakeFile()
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

    private throw(err: string) {
        throw new Error(err)
    }

    private async createTestFile() {
        await this.writeFile(this.testFilePath, this.testFileContent)
    }

    private get testFilePath() {
        return `${this.testSaveDir}/${this.testFileName}`
    }

    private async createModuleFile() {
        await this.writeFile(this.moduleFilePath, this.moduleFileContent)
    }

    private get moduleFilePath() {
        return `${this.moduleSaveDir}/${this.moduleFileName}`
    }

    private async createFakeFile() {
        await this.writeFile(this.fakeFilePath, this.fakeFileContent)
    }

    private get fakeFilePath() {
        return `${this.fakeSaveDir}/${this.fakeFileName}`
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
    moduleFileName: string
    moduleFileContent: string
    fakeFileName: string
    fakeFileContent: string
}
