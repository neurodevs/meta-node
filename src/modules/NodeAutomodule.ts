import { writeFile } from 'fs/promises'
import path from 'path'
import pathExists from './pathExists'

export default class NodeAutomodule implements Automodule {
    public static Class?: AutomoduleConstructor
    public static pathExists = pathExists
    public static writeFile = writeFile

    private testSaveDir: string
    private moduleSaveDir: string
    private implName: string

    protected constructor(options: AutomoduleOptions) {
        const { testSaveDir, moduleSaveDir, implName } = options

        this.testSaveDir = testSaveDir
        this.moduleSaveDir = moduleSaveDir
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
        await this.writeFile(this.testFileName, this.testPattern)
    }

    private get testFileName() {
        return path.join(this.testSaveDir, `${this.implName}.test.ts`)
    }

    private async createModuleFile() {
        await this.writeFile(this.moduleFileName, NodeAutomodule.modulePattern)
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

    private readonly testPattern = `
        import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
        import YourClassImpl, { YourClass } from './YourClassImpl'

        export default class YourClassImplTest extends AbstractSpruceTest {
            private static instance: YourClass
            
            protected static async beforeEach() {
                await super.beforeEach()
                
                this.instance = this.YourClassImpl()
            }
            
            @test()
            protected static async createsInstance() {
                assert.isTruthy(this.instance, 'Failed to create instance!')
            }
            
            private static YourClassImpl() {
                return YourClassImpl.Create()
            }
        }
    `

    private static readonly modulePattern = `
        export default class YourClassImpl implements YourClass {
            public static Class?: YourClassConstructor
            
            protected constructor() {}
            
            public static Create() {
                return new (this.Class ?? this)()
            }
        }

        export interface YourClass {}

        export type YourClassConstructor = new () => YourClass
    `
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
    implName: string
}
