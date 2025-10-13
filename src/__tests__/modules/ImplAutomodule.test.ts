import { writeFile } from 'fs/promises'
import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import ImplAutomodule, { Automodule } from '../../modules/ImplAutomodule'
import fakePathExists, {
    setPathShouldExist,
} from '../../testDoubles/fs/fakePathExists'
import fakeWriteFile, {
    callsToWriteFile,
    resetCallsToWriteFile,
} from '../../testDoubles/fs/fakeWriteFile'

export default class ImplAutomoduleTest extends AbstractSpruceTest {
    private static instance: Automodule

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakePathExists()
        this.setFakeWriteFile()

        this.instance = this.ImplAutomodule()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async runThrowsIfTestSaveDirMissing() {
        setPathShouldExist(this.testSaveDir, false)

        const err = await assert.doesThrowAsync(async () => await this.run())

        assert.isEqual(
            err.message,
            `testSaveDir does not exist: ${this.testSaveDir}!`,
            'Did not receive the expected error!'
        )
    }

    @test()
    protected static async runThrowsIfModuleSaveDirMissing() {
        setPathShouldExist(this.moduleSaveDir, false)

        const err = await assert.doesThrowAsync(async () => await this.run())

        assert.isEqual(
            err.message,
            `moduleSaveDir does not exist: ${this.moduleSaveDir}!`,
            'Did not receive the expected error!'
        )
    }

    @test()
    protected static async runThrowsIfFakeSaveDirMissing() {
        setPathShouldExist(this.fakeSaveDir, false)

        const err = await assert.doesThrowAsync(async () => await this.run())

        assert.isEqual(
            err.message,
            `fakeSaveDir does not exist: ${this.fakeSaveDir}!`,
            'Did not receive the expected error!'
        )
    }

    @test()
    protected static async createsTestFileAsExpected() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[0],
            {
                file: `${this.testSaveDir}/${this.implName}.test.ts`,
                data: this.testFilePattern,
            },
            'Did not write expected test file!'
        )
    }

    @test()
    protected static async createsModuleFileAsExpected() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[1],
            {
                file: `${this.moduleSaveDir}/${this.implName}.ts`,
                data: this.moduleFilePattern,
            },
            'Did not write expected module file!'
        )
    }

    @test()
    protected static async createsFakeFileAsExpected() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[2],
            {
                file: `${this.fakeSaveDir}/Fake${this.interfaceName}.ts`,
                data: this.fakeFilePattern,
            },
            'Did not write expected fake file!'
        )
    }

    private static async run() {
        return await this.instance.run()
    }

    private static setFakePathExists() {
        ImplAutomodule.pathExists = fakePathExists

        setPathShouldExist(this.testSaveDir, true)
        setPathShouldExist(this.moduleSaveDir, true)
        setPathShouldExist(this.fakeSaveDir, true)
    }

    private static setFakeWriteFile() {
        ImplAutomodule.writeFile = fakeWriteFile as typeof writeFile
        resetCallsToWriteFile()
    }
    private static readonly interfaceName = generateId()
    private static readonly implName = generateId()

    private static readonly testSaveDir = generateId()
    private static readonly moduleSaveDir = generateId()
    private static readonly fakeSaveDir = generateId()

    private static get testFilePattern() {
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

    private static get moduleFilePattern() {
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

    private static get fakeFilePattern() {
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

    private static ImplAutomodule() {
        return ImplAutomodule.Create({
            testSaveDir: this.testSaveDir,
            moduleSaveDir: this.moduleSaveDir,
            fakeSaveDir: this.fakeSaveDir,
            interfaceName: this.interfaceName,
            implName: this.implName,
        })
    }
}
