import { writeFile } from 'fs/promises'
import path from 'path'
import pathExists from './pathExists'

export default class NodeAutomodule implements Automodule {
    public static Class?: AutomoduleConstructor
    public static pathExists = pathExists
    public static writeFile = writeFile

    private testSaveDir: string
    private moduleSaveDir: string
    private interfaceName: string
    private implName: string

    protected constructor(options: AutomoduleOptions) {
        const { testSaveDir, moduleSaveDir, interfaceName, implName } = options

        this.testSaveDir = testSaveDir
        this.moduleSaveDir = moduleSaveDir
        this.interfaceName = interfaceName
        this.implName = implName
    }

    public static Create(options: AutomoduleOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        await this.throwIfTestDirDoesNotExist()
        await this.throwIfModuleDirDoesNotExist()

        await this.createTestFile()
        await this.createModuleFile()
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

    private get pathExists() {
        return NodeAutomodule.pathExists
    }

    private get writeFile() {
        return NodeAutomodule.writeFile
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
    interfaceName: string
    implName: string
}
