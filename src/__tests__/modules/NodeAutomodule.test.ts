import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import NodeAutomodule, { Automodule } from '../../modules/NodeAutomodule'

export default class NodeAutomoduleTest extends AbstractSpruceTest {
    private static instance: Automodule

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.NodeAutomodule()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static NodeAutomodule() {
        return NodeAutomodule.Create()
    }
}
