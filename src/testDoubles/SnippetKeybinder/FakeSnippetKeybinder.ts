import { SnippetKeybinder } from '../../modules/VscodeSnippetKeybinder'

export default class FakeSnippetKeybinder implements SnippetKeybinder {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeSnippetKeybinder.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeSnippetKeybinder.numCallsToConstructor = 0
    }
}
