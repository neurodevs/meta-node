export default class TypescriptClassSnippetSuite implements SnippetSuite {
    public static Class?: SnippetSuiteConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface SnippetSuite {}

export type SnippetSuiteConstructor = new () => SnippetSuite
