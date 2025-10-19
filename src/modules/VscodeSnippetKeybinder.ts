export default class VscodeSnippetKeybinder implements SnippetKeybinder {
    public static Class?: SnippetKeybinderConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface SnippetKeybinder {}

export type SnippetKeybinderConstructor = new () => SnippetKeybinder
