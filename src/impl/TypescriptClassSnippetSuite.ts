import { readFile, writeFile } from 'fs/promises'
import expandHomeDir from '../scripts/expandHomeDir'

export default class TypescriptClassSnippetSuite implements SnippetSuite {
    public static Class?: SnippetSuiteConstructor
    public static readFile = readFile
    public static writeFile = writeFile

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async install() {
        const original = await this.readFile(this.snippetsPath, 'utf-8')
        const parsed = JSON.parse(original)

        for (const [name, snippet] of Object.entries(this.snippets)) {
            parsed[name] = snippet
        }

        const updated = JSON.stringify(parsed, null, 4)

        if (original !== updated) {
            await this.writeFile(this.snippetsPath, updated)
        }
    }

    protected get snippetsPath() {
        return `${this.vscodeDir}/snippets/custom.code-snippets`
    }

    protected readonly vscodeDir = expandHomeDir(
        '~/Library/Application Support/Code/User'
    )

    private get readFile() {
        return TypescriptClassSnippetSuite.readFile
    }

    private get writeFile() {
        return TypescriptClassSnippetSuite.writeFile
    }

    private readonly snippets = {
        // === PUBLIC ===
        'Public constructor': {
            scope: 'typescript',
            prefix: 'public.constructor',
            body: ['public constructor() {}'],
        },
        'Public field': {
            scope: 'typescript',
            prefix: 'public.field',
            body: ['public newField = undefined'],
        },
        'Public readonly field': {
            scope: 'typescript',
            prefix: 'public.readonly.field',
            body: ['public readonly newField = undefined'],
        },
        'Public getter': {
            scope: 'typescript',
            prefix: 'public.getter',
            body: ['public get newProperty() { return undefined }'],
        },
        'Public setter': {
            scope: 'typescript',
            prefix: 'public.setter',
            body: ['public set newProperty(_value: unknown) {}'],
        },
        'Public method': {
            scope: 'typescript',
            prefix: 'public.method',
            body: ['public newMethod() {}'],
        },
        'Public async method': {
            scope: 'typescript',
            prefix: 'public.async.method',
            body: ['public async newMethod() {}'],
        },
        'Public abstract method': {
            scope: 'typescript',
            prefix: 'public.abstract.method',
            body: ['public abstract newMethod(): unknown'],
        },

        // === PROTECTED ===
        'Protected constructor': {
            scope: 'typescript',
            prefix: 'protected.constructor',
            body: ['protected constructor() {}'],
        },
        'Protected field': {
            scope: 'typescript',
            prefix: 'protected.field',
            body: ['protected newField = undefined'],
        },
        'Protected readonly field': {
            scope: 'typescript',
            prefix: 'protected.readonly.field',
            body: ['protected readonly newField = undefined'],
        },
        'Protected getter': {
            scope: 'typescript',
            prefix: 'protected.getter',
            body: ['protected get newProperty() { return undefined }'],
        },
        'Protected setter': {
            scope: 'typescript',
            prefix: 'protected.setter',
            body: ['protected set newProperty(_value: unknown) {}'],
        },
        'Protected method': {
            scope: 'typescript',
            prefix: 'protected.method',
            body: ['protected newMethod() {}'],
        },
        'Protected async method': {
            scope: 'typescript',
            prefix: 'protected.async.method',
            body: ['protected async newMethod() {}'],
        },
        'Protected abstract method': {
            scope: 'typescript',
            prefix: 'protected.abstract.method',
            body: ['protected abstract newMethod(): unknown'],
        },

        // === PRIVATE ===
        'Private constructor': {
            scope: 'typescript',
            prefix: 'private.constructor',
            body: ['private constructor() {}'],
        },
        'Private field': {
            scope: 'typescript',
            prefix: 'private.field',
            body: ['private newField = undefined'],
        },
        'Private readonly field': {
            scope: 'typescript',
            prefix: 'private.readonly.field',
            body: ['private readonly newField = undefined'],
        },
        'Private getter': {
            scope: 'typescript',
            prefix: 'private.getter',
            body: ['private get newProperty() { return undefined }'],
        },
        'Private setter': {
            scope: 'typescript',
            prefix: 'private.setter',
            body: ['private set newProperty(_value: unknown) {}'],
        },
        'Private method': {
            scope: 'typescript',
            prefix: 'private.method',
            body: ['private newMethod() {}'],
        },
        'Private async method': {
            scope: 'typescript',
            prefix: 'private.async.method',
            body: ['private async newMethod() {}'],
        },
        'Private abstract method': {
            scope: 'typescript',
            prefix: 'private.abstract.method',
            body: ['private abstract newMethod(): unknown'],
        },

        // === PUBLIC STATIC ===
        'Public static field': {
            scope: 'typescript',
            prefix: 'public.static.field',
            body: ['public static newField = undefined'],
        },
        'Public static readonly field': {
            scope: 'typescript',
            prefix: 'public.static.readonly.field',
            body: ['public static readonly newField = undefined'],
        },
        'Public static getter': {
            scope: 'typescript',
            prefix: 'public.static.getter',
            body: ['public static get newProperty() { return undefined }'],
        },
        'Public static setter': {
            scope: 'typescript',
            prefix: 'public.static.setter',
            body: ['public static set newProperty(_value: unknown) {}'],
        },
        'Public static method': {
            scope: 'typescript',
            prefix: 'public.static.method',
            body: ['public static newMethod() {}'],
        },
        'Public static async method': {
            scope: 'typescript',
            prefix: 'public.static.async.method',
            body: ['public static async newMethod() {}'],
        },

        // === PROTECTED STATIC ===
        'Protected static field': {
            scope: 'typescript',
            prefix: 'protected.static.field',
            body: ['protected static newField = undefined'],
        },
        'Protected static readonly field': {
            scope: 'typescript',
            prefix: 'protected.static.readonly.field',
            body: ['protected static readonly newField = undefined'],
        },
        'Protected static getter': {
            scope: 'typescript',
            prefix: 'protected.static.getter',
            body: ['protected static get newProperty() { return undefined }'],
        },
        'Protected static setter': {
            scope: 'typescript',
            prefix: 'protected.static.setter',
            body: ['protected static set newProperty(_value: unknown) {}'],
        },
        'Protected static method': {
            scope: 'typescript',
            prefix: 'protected.static.method',
            body: ['protected static newMethod() {}'],
        },
        'Protected static async method': {
            scope: 'typescript',
            prefix: 'protected.static.async.method',
            body: ['protected static async newMethod() {}'],
        },

        // === PRIVATE STATIC ===
        'Private static field': {
            scope: 'typescript',
            prefix: 'private.static.field',
            body: ['private static newField = undefined'],
        },
        'Private static readonly field': {
            scope: 'typescript',
            prefix: 'private.static.readonly.field',
            body: ['private static readonly newField = undefined'],
        },
        'Private static getter': {
            scope: 'typescript',
            prefix: 'private.static.getter',
            body: ['private static get newProperty() { return undefined }'],
        },
        'Private static setter': {
            scope: 'typescript',
            prefix: 'private.static.setter',
            body: ['private static set newProperty(_value: unknown) {}'],
        },
        'Private static method': {
            scope: 'typescript',
            prefix: 'private.static.method',
            body: ['private static newMethod() {}'],
        },
        'Private static async method': {
            scope: 'typescript',
            prefix: 'private.static.async.method',
            body: ['private static async newMethod() {}'],
        },
    }
}

export interface SnippetSuite {
    install(): Promise<void>
}

export type SnippetSuiteConstructor = new () => SnippetSuite
