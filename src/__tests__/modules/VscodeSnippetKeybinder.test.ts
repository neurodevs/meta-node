import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import VscodeSnippetKeybinder, {
    SnippetKeybinder,
} from '../../modules/VscodeSnippetKeybinder'

export default class VscodeSnippetKeybinderTest extends AbstractSpruceTest {
    private static instance: SnippetKeybinder

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.VscodeSnippetKeybinder()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static VscodeSnippetKeybinder() {
        return VscodeSnippetKeybinder.Create()
    }
}
