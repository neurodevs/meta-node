import { test, assert } from '@neurodevs/node-tdd'

import PackageAutodocumenter, {
    Autodocumenter,
} from '../../impl/PackageAutodocumenter.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class PackageAutodocumenterTest extends AbstractPackageTest {
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
