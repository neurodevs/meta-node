import { test, assert } from '@sprucelabs/test-utils'
import UiAutomodule from '../../modules/UiAutomodule'
import { Automodule } from '../../types'
import AbstractPackageTest from '../AbstractPackageTest'

export default class UiAutomoduleTest extends AbstractPackageTest {
    private static instance: Automodule

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.UiAutomodule()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static UiAutomodule() {
        return UiAutomodule.Create({
            testSaveDir: this.testSaveDir,
            moduleSaveDir: this.moduleSaveDir,
            fakeSaveDir: this.fakeSaveDir,
        })
    }
}
