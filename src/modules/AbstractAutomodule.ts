import { exec as execSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { promisify } from 'util'
import { pathExists } from 'fs-extra'
import { Automodule, BaseAutomoduleOptions } from '../types'

export default abstract class AbstractAutomodule implements Automodule {
    public static exec = promisify(execSync)
    public static pathExists = pathExists
    public static writeFile = writeFile
    public static readFile = readFile

    protected testSaveDir: string
    protected moduleSaveDir: string
    protected fakeSaveDir: string

    protected testFileName!: string
    protected testFileContent!: string
    protected moduleFileName!: string
    protected moduleFileContent!: string
    protected fakeFileName!: string
    protected fakeFileContent!: string
    protected indexFileContent!: string

    protected originalIndexFile!: string

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
            indexFileContent,
        } = options

        this.testFileName = testFileName
        this.testFileContent = testFileContent
        this.moduleFileName = moduleFileName
        this.moduleFileContent = moduleFileContent
        this.fakeFileName = fakeFileName
        this.fakeFileContent = fakeFileContent
        this.indexFileContent = indexFileContent

        await this.throwIfDirectoriesDoNotExist()

        await this.createTestFile()
        await this.createModuleFile()
        await this.createFakeFile()

        await this.updateIndexFileExports()
        await this.bumpMinorVersion()
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

    private async updateIndexFileExports() {
        this.originalIndexFile = await this.loadOriginalIndexFile()
        await this.writeFile(this.indexFilePath, this.sortedIndexFile)
    }

    private async loadOriginalIndexFile() {
        return await this.readFile(this.indexFilePath, 'utf-8')
    }

    private readonly indexFilePath = './src/index.ts'

    private get sortedIndexFile() {
        const blocks = `${this.originalIndexFile}${this.indexFileContent}`
            .split(/(?=\/\/)/)
            .map((s) => s.trim())
            .filter(Boolean)

        blocks.sort((a, b) => {
            const aKey = a.match(/^\/\/\s*([^\n]*)/)?.[1]?.trim() ?? ''
            const bKey = b.match(/^\/\/\s*([^\n]*)/)?.[1]?.trim() ?? ''
            return aKey.localeCompare(bKey)
        })

        return blocks.join('\n\n')
    }

    private async bumpMinorVersion() {
        await this.exec('yarn version --minor --no-git-tag-version')
    }

    private get exec() {
        return AbstractAutomodule.exec
    }

    private get pathExists() {
        return AbstractAutomodule.pathExists
    }

    protected get writeFile() {
        return AbstractAutomodule.writeFile
    }

    private get readFile() {
        return AbstractAutomodule.readFile
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
    indexFileContent: string
}
