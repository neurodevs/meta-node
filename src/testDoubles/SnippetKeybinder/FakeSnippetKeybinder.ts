import {
    SnippetKeybinder,
    SnippetKeybinderOptions,
} from '../../impl/VscodeSnippetKeybinder'

export default class FakeSnippetKeybinder implements SnippetKeybinder {
    public static callsToConstructor: SnippetKeybinderOptions[]
    public static numCallsToRun = 0

    public constructor(options: SnippetKeybinderOptions) {
        FakeSnippetKeybinder.callsToConstructor.push(options)
    }

    public async run() {
        FakeSnippetKeybinder.numCallsToRun++
    }

    public static resetTestDouble() {
        FakeSnippetKeybinder.callsToConstructor = []
        FakeSnippetKeybinder.numCallsToRun = 0
    }
}
