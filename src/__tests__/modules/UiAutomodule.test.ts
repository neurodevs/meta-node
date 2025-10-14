import { test, assert } from '@sprucelabs/test-utils'
import UiAutomodule from '../../modules/UiAutomodule'
import AbstractAutomoduleTest from '../AbstractAutomoduleTest'

export default class UiAutomoduleTest extends AbstractAutomoduleTest {
    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.UiAutomodule()
    }

    @test()
    protected static async passesAbstractTests() {
        await this.runAbstractTests()
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
