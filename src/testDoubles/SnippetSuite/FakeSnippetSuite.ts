import { SnippetSuite } from '../../impl/TypescriptClassSnippetSuite'

export default class FakeSnippetSuite implements SnippetSuite {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeSnippetSuite.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeSnippetSuite.numCallsToConstructor = 0
    }
}
