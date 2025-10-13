import { exec as execSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { promisify } from 'util'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import ImplAutomodule, { Automodule } from '../../modules/ImplAutomodule'
import fakeExec, { callsToExec } from '../../testDoubles/child_process/fakeExec'
import fakePathExists, {
    setPathShouldExist,
} from '../../testDoubles/fs/fakePathExists'
import fakeReadFile, {
    fakeReadFileResult,
    resetCallsToReadFile,
    setFakeReadFileResult,
} from '../../testDoubles/fs/fakeReadFile'
import fakeWriteFile, {
    callsToWriteFile,
    resetCallsToWriteFile,
} from '../../testDoubles/fs/fakeWriteFile'
import AbstractPackageTest from '../AbstractPackageTest'

const exec = promisify(execSync)

export default class ImplAutomoduleTest extends AbstractPackageTest {
    private static instance: Automodule

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeExec()
        this.setFakePathExists()
        this.setFakeReadFile()
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

    @test()
    protected static async sortsIndexFileExportsAlphabetically() {
        setFakeReadFileResult(`
            // A-${fakeReadFileResult}
            
            // C-${fakeReadFileResult}
        `)

        await this.run()

        const call = callsToWriteFile[3]

        assert.isEqualDeep(
            {
                file: call.file,
                data: this.normalize(call.data),
            },
            {
                file: this.indexFilePath,
                data: this.normalize(this.sortedIndexFile),
            },
            'Did not update index file as expected!'
        )
    }

    @test()
    protected static async bumpsMinorVersionWithYarn() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[0],
            'yarn version --minor --no-git-tag-version',
            'Did not bump minor version!'
        )
    }

    private static async run() {
        return await this.instance.run()
    }

    private static setFakeExec() {
        ImplAutomodule.exec = fakeExec as unknown as typeof exec
    }

    private static setFakePathExists() {
        ImplAutomodule.pathExists = fakePathExists

        setPathShouldExist(this.testSaveDir, true)
        setPathShouldExist(this.moduleSaveDir, true)
        setPathShouldExist(this.fakeSaveDir, true)
        setPathShouldExist(this.indexFilePath, true)
    }

    private static setFakeReadFile() {
        ImplAutomodule.readFile = fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()
    }

    private static setFakeWriteFile() {
        ImplAutomodule.writeFile = fakeWriteFile as typeof writeFile
        resetCallsToWriteFile()
    }
    private static readonly interfaceName = `B-${generateId()}`
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

    private static readonly indexFilePath = './src/index.ts'

    private static get indexFilePattern() {
        return `
            ${fakeReadFileResult}

            // ${this.interfaceName}

            export { default as ${this.implName} } from './modules/${this.implName}'
            export * from './modules/${this.implName}'

            export { default as Fake${this.interfaceName} } from './testDoubles/${this.interfaceName}/Fake${this.interfaceName}'
            export * from './testDoubles/${this.interfaceName}/Fake${this.interfaceName}'

        `
    }

    private static get sortedIndexFile() {
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
