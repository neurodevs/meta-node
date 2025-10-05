import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import PackageJsonUpdater, {
    JsonUpdater,
} from '../../modules/PackageJsonUpdater'

export default class PackageJsonUpdaterTest extends AbstractSpruceTest {
    private static instance: JsonUpdater

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.PackageJsonUpdater()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static PackageJsonUpdater() {
        return PackageJsonUpdater.Create()
    }
}
