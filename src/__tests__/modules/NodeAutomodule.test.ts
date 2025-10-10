import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import NodeAutomodule, { Automodule } from '../../modules/NodeAutomodule'
import fakePathExists, {
    setPathShouldExist,
} from '../../testDoubles/fakePathExists'

export default class NodeAutomoduleTest extends AbstractSpruceTest {
    private static instance: Automodule

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakePathExists()

        this.instance = this.NodeAutomodule()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async runThrowsIfTestSaveDirMissing() {
        setPathShouldExist(this.testSaveDir, false)

        const err = await assert.doesThrowAsync(
            async () => await this.instance.run()
        )

        assert.isEqual(
            err.message,
            `testSaveDir does not exist: ${this.testSaveDir}!`,
            'Did not receive the expected error!'
        )
    }

    @test()
    protected static async runThrowsIfModuleSaveDirMissing() {
        setPathShouldExist(this.moduleSaveDir, false)

        const err = await assert.doesThrowAsync(
            async () => await this.instance.run()
        )

        assert.isEqual(
            err.message,
            `moduleSaveDir does not exist: ${this.moduleSaveDir}!`,
            'Did not receive the expected error!'
        )
    }

    private static setFakePathExists() {
        NodeAutomodule.pathExists = fakePathExists

        setPathShouldExist(this.testSaveDir, true)
        setPathShouldExist(this.moduleSaveDir, true)
    }

    private static readonly testSaveDir = generateId()
    private static readonly moduleSaveDir = generateId()

    private static NodeAutomodule() {
        return NodeAutomodule.Create({
            testSaveDir: this.testSaveDir,
            moduleSaveDir: this.moduleSaveDir,
        })
    }
}
