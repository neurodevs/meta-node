import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import TypescriptClassSnippetSuite, {
    SnippetSuite,
} from '../../impl/TypescriptClassSnippetSuite'

export default class TypescriptClassSnippetSuiteTest extends AbstractSpruceTest {
    private static instance: SnippetSuite

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.TypescriptClassSnippetSuite()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static TypescriptClassSnippetSuite() {
        return TypescriptClassSnippetSuite.Create()
    }
}
