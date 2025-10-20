import { SnippetSuite } from '../../impl/TypescriptClassSnippetSuite'

export default class FakeSnippetSuite implements SnippetSuite {
    public static numCallsToConstructor = 0
    public static numCallsToInstall = 0

    public constructor() {
        FakeSnippetSuite.numCallsToConstructor++
    }

    public async install() {
        FakeSnippetSuite.numCallsToInstall++
    }

    public static resetTestDouble() {
        FakeSnippetSuite.numCallsToConstructor = 0
        FakeSnippetSuite.numCallsToInstall = 0
    }
}
