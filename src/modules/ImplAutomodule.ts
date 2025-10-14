import { exec as execSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { promisify } from 'util'
import { pathExists } from 'fs-extra'
import { Automodule, BaseAutomoduleOptions } from '../types'

export default class ImplAutomodule implements Automodule {
    public static Class?: ImplAutomoduleConstructor
    public static exec = promisify(execSync)
    public static pathExists = pathExists
    public static readFile = readFile
    public static writeFile = writeFile

    private testSaveDir: string
    private moduleSaveDir: string
    private fakeSaveDir: string
    private interfaceName: string
    private implName: string

    private originalIndexFile!: string

    protected constructor(options: ImplAutomoduleOptions) {
        const {
            testSaveDir,
            moduleSaveDir,
            fakeSaveDir,
            interfaceName,
            implName,
        } = options

        this.testSaveDir = testSaveDir
        this.moduleSaveDir = moduleSaveDir
        this.fakeSaveDir = fakeSaveDir
        this.interfaceName = interfaceName
        this.implName = implName
    }

    public static Create(options: ImplAutomoduleOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
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
        await this.writeFile(this.testFileName, this.testFilePattern)
    }

    private get testFileName() {
        return path.join(this.testSaveDir, `${this.implName}.test.ts`)
    }

    private async createModuleFile() {
        await this.writeFile(this.moduleFileName, this.moduleFilePattern)
    }

    private get moduleFileName() {
        return path.join(this.moduleSaveDir, `${this.implName}.ts`)
    }

    private async createFakeFile() {
        await this.writeFile(this.fakeFileName, this.fakeFilePattern)
    }

    private get fakeFileName() {
        return path.join(this.fakeSaveDir, `Fake${this.interfaceName}.ts`)
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
        const blocks = this.indexFilePattern
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
        return ImplAutomodule.exec
    }

    private get pathExists() {
        return ImplAutomodule.pathExists
    }

    private get readFile() {
        return ImplAutomodule.readFile
    }

    private get writeFile() {
        return ImplAutomodule.writeFile
    }

    private get testFilePattern() {
        return `
            import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
            import ${this.implName}, { ${this.interfaceName} } from '../../modules/${this.implName}'

            export default class ${this.implName}Test extends AbstractSpruceTest {
                private static instance: ${this.interfaceName}
                
                protected static async beforeEach() {
                    await super.beforeEach()
                    
                    this.instance = this.${this.implName}()
                }
                
                @test()
                protected static async createsInstance() {
                    assert.isTruthy(this.instance, 'Failed to create instance!')
                }
                
                private static ${this.implName}() {
                    return ${this.implName}.Create()
                }
            }
        `
    }

    private get moduleFilePattern() {
        return `
            export default class ${this.implName} implements ${this.interfaceName} {
                public static Class?: ${this.interfaceName}Constructor
                
                protected constructor() {}
                
                public static Create() {
                    return new (this.Class ?? this)()
                }
            }

            export interface ${this.interfaceName} {}

            export type ${this.interfaceName}Constructor = new () => ${this.interfaceName}
        `
    }

    private get fakeFilePattern() {
        return `
            import { ${this.interfaceName} } from '../../modules/${this.implName}'

            export default class Fake${this.interfaceName} implements ${this.interfaceName} {
                public static numCallsToConstructor = 0
                
                public constructor() {
                    Fake${this.interfaceName}.numCallsToConstructor++
                }
                
                public static resetTestDouble() {
                    Fake${this.interfaceName}.numCallsToConstructor = 0
                }
            }
        `
    }

    private get indexFilePattern() {
        return `
            ${this.originalIndexFile}

            // ${this.interfaceName}

            export { default as ${this.implName} } from './modules/${this.implName}'
            export * from './modules/${this.implName}'

            export { default as Fake${this.interfaceName} } from './testDoubles/${this.interfaceName}/Fake${this.interfaceName}'
            export * from './testDoubles/${this.interfaceName}/Fake${this.interfaceName}'
        `
    }
}

export type ImplAutomoduleConstructor = new (
    options: ImplAutomoduleOptions
) => Automodule

export interface ImplAutomoduleOptions extends BaseAutomoduleOptions {
    interfaceName: string
    implName: string
}
