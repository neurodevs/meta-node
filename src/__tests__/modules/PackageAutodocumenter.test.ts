import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import PackageAutodocumenter, {
    Autodocumenter,
} from '../../modules/PackageAutodocumenter'

export default class PackageAutodocumenterTest extends AbstractSpruceTest {
    private static instance: Autodocumenter

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.PackageAutodocumenter()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static PackageAutodocumenter() {
        return PackageAutodocumenter.Create()
    }
}
