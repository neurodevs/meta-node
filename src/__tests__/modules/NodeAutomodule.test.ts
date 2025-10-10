import { writeFile } from 'fs/promises'
import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import NodeAutomodule, { Automodule } from '../../modules/NodeAutomodule'
import fakePathExists, {
    setPathShouldExist,
} from '../../testDoubles/fs/fakePathExists'
import fakeWriteFile, {
    callsToWriteFile,
    resetCallsToWriteFile,
} from '../../testDoubles/fs/fakeWriteFile'

export default class NodeAutomoduleTest extends AbstractSpruceTest {
    private static instance: Automodule

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakePathExists()
        this.setFakeWriteFile()

        this.instance = this.NodeAutomodule()
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
    protected static async createsTestFileAsExpected() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[0],
            {
                file: `${this.testSaveDir}/${this.implName}.test.ts`,
                data: this.testPattern,
            },
            'Did not write expected test file!'
        )
    }

    private static async run() {
        return await this.instance.run()
    }

    private static setFakePathExists() {
        NodeAutomodule.pathExists = fakePathExists

        setPathShouldExist(this.testSaveDir, true)
        setPathShouldExist(this.moduleSaveDir, true)
    }

    private static setFakeWriteFile() {
        NodeAutomodule.writeFile = fakeWriteFile as typeof writeFile
        resetCallsToWriteFile()
    }

    private static readonly testSaveDir = generateId()
    private static readonly moduleSaveDir = generateId()
    private static readonly implName = generateId()

    private static readonly testPattern = `
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

    private static NodeAutomodule() {
        return NodeAutomodule.Create({
            testSaveDir: this.testSaveDir,
            moduleSaveDir: this.moduleSaveDir,
            implName: this.implName,
        })
    }
}
