import { test, assert, generateId } from '@sprucelabs/test-utils'
import {
    callsToExec,
    callsToWriteFile,
    setFakeReadFileResult,
    setFakeReadFileThrowsFor,
} from '@neurodevs/fake-node-core'
import ImplAutomodule from '../../modules/ImplAutomodule'
import AbstractAutomoduleTest from '../AbstractAutomoduleTest'

export default class ImplAutomoduleTest extends AbstractAutomoduleTest {
    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeIndexFileOnReadFile()

        this.instance = this.ImplAutomodule()
    }

    @test()
    protected static async passesAbstractTests() {
        await this.runAbstractTests()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsTestFileAsExpected() {
        await this.run()

        assert.isEqualDeep(
            {
                file: callsToWriteFile[0].file,
                data: this.normalize(callsToWriteFile[0].data),
            },
            {
                file: `${this.testSaveDir}/${this.implName}.test.ts`,
                data: this.normalize(this.testFilePattern),
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
                options: undefined,
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
                options: undefined,
            },
            'Did not write expected fake file!'
        )
    }

    @test()
    protected static async sortsIndexFileExportsAlphabetically() {
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
    protected static async triesBackupIndexFilePathIfNotFound() {
        setFakeReadFileThrowsFor(this.indexFilePath)
        setFakeReadFileResult('./src/exports.ts', this.originalIndexFile)

        await this.run()

        const call = callsToWriteFile[3]

        assert.isEqualDeep(
            {
                file: call.file,
                data: this.normalize(call.data),
            },
            {
                file: './src/exports.ts',
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

    private static readonly interfaceName = `B-${generateId()}`
    private static readonly implName = generateId()

    private static setFakeIndexFileOnReadFile() {
        setFakeReadFileResult(this.indexFilePath, this.originalIndexFile)
    }

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

    private static get indexFilePattern() {
        return `
            // ${this.interfaceName}

            export { default as ${this.implName} } from './modules/${this.implName}'
            export * from './modules/${this.implName}'

            export { default as Fake${this.interfaceName} } from './testDoubles/${this.interfaceName}/Fake${this.interfaceName}'
            export * from './testDoubles/${this.interfaceName}/Fake${this.interfaceName}'

        `
    }

    private static get sortedIndexFile() {
        const blocks = `${this.originalIndexFile}${this.indexFilePattern}`
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
