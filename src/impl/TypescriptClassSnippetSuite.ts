import { readFile, writeFile } from 'fs/promises'
import expandHomeDir from '../scripts/expandHomeDir'

export default class TypescriptClassSnippetSuite implements SnippetSuite {
    public static Class?: SnippetSuiteConstructor
    public static readFile = readFile
    public static writeFile = writeFile

    private originalSnippetsFile!: string
    private originalKeybindingsFile!: string

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public async install() {
        await this.installGlobalSnippets()
        await this.installGlobalKeybindings()
    }

    private async installGlobalSnippets() {
        this.originalSnippetsFile = await this.loadSnippetsFile()

        if (!this.hasSnippetMarkers) {
            await this.installFreshSnippets()
        } else {
            await this.updateExistingSnippets()
        }
    }

    private async loadSnippetsFile() {
        return await this.readFile(this.snippetsPath, 'utf-8')
    }

    private get snippetsPath() {
        return `${this.vscodeDir}/snippets/custom.code-snippets`
    }

    private readonly vscodeDir = expandHomeDir(
        '~/Library/Application Support/Code/User'
    )

    private get hasSnippetMarkers() {
        return this.snippetStartIdx !== -1 && this.snippetEndIdx !== -1
    }

    private get snippetStartIdx() {
        return this.originalSnippetsFile.indexOf(this.snippetStartMarker)
    }

    private snippetStartMarker = '// === TYPESCRIPT CLASS SNIPPETS BEGIN ==='

    private get snippetEndIdx() {
        return (
            this.originalSnippetsFile.indexOf(this.snippetEndMarker) +
            this.snippetEndMarker.length
        )
    }

    private snippetEndMarker = '// === TYPESCRIPT CLASS SNIPPETS END ==='

    private async installFreshSnippets() {
        await this.writeFile(this.snippetsPath, this.freshSnippetsFile)
    }

    private get freshSnippetsFile() {
        const lastBraceIdx = this.originalSnippetsFile.lastIndexOf('}')
        const before = this.originalSnippetsFile.slice(0, lastBraceIdx)

        return `${before}${this.snippetsBlock}\n}`
    }

    private get snippetsBlock() {
        return `    ${this.snippetStartMarker}\n${this.indentedSnippets}\n    ${this.snippetEndMarker}`
    }

    private async updateExistingSnippets() {
        const before = this.originalSnippetsFile.slice(0, this.snippetStartIdx)

        const existing = this.originalSnippetsFile.slice(
            this.snippetStartIdx,
            this.snippetEndIdx
        )

        const after = this.originalSnippetsFile.slice(this.snippetEndIdx)

        if (existing.trim() !== this.snippetsBlock.trim()) {
            await this.writeFile(
                this.snippetsPath,
                `${before}${this.snippetsBlock}${after}`
            )
        }
    }

    private async installGlobalKeybindings() {
        this.originalKeybindingsFile = await this.loadKeybindingsFile()

        await this.writeFile(this.keybindingsPath, this.updatedKeybindingFile)
    }

    private async loadKeybindingsFile() {
        return await this.readFile(this.keybindingsPath, 'utf-8')
    }

    private get keybindingsPath() {
        return `${this.vscodeDir}/keybindings.json`
    }

    private get updatedKeybindingFile() {
        const lastBraceIdx = this.originalKeybindingsFile.lastIndexOf(']')
        const before = this.originalKeybindingsFile.slice(0, lastBraceIdx)

        return `${before}${this.keybindingBlock}\n]`
    }

    private get keybindingBlock() {
        return `${this.keybindStartMarker}\n${this.keybindings}\n${this.keybindEndMarker}`
    }

    private keybindStartMarker = '// === TYPESCRIPT CLASS KEYBINDINGS BEGIN ==='
    private keybindEndMarker = '// === TYPESCRIPT CLASS KEYBINDINGS END ==='

    private get readFile() {
        return TypescriptClassSnippetSuite.readFile
    }

    private get writeFile() {
        return TypescriptClassSnippetSuite.writeFile
    }

    private readonly snippets = `
        // === PUBLIC ===
        "Public constructor": { "scope": "typescript", "prefix": "public.constructor", "body": ["public constructor() {}"] },
        "Public field": { "scope": "typescript", "prefix": "public.field", "body": ["public newField = undefined"] },
        "Public readonly field": { "scope": "typescript", "prefix": "public.readonly.field", "body": ["public readonly newField = undefined"] },
        "Public getter": { "scope": "typescript", "prefix": "public.getter", "body": ["public get newProperty() { return undefined }"] },
        "Public setter": { "scope": "typescript", "prefix": "public.setter", "body": ["public set newProperty(_value: unknown) {}"] },
        "Public method": { "scope": "typescript", "prefix": "public.method", "body": ["public newMethod() {}"] },
        "Public async method": { "scope": "typescript", "prefix": "public.async.method", "body": ["public async newMethod() {}"] },
        "Public abstract method": { "scope": "typescript", "prefix": "public.abstract.method", "body": ["public abstract newMethod(): unknown"] },

        // === PROTECTED ===
        "Protected constructor": { "scope": "typescript", "prefix": "protected.constructor", "body": ["protected constructor() {}"] },
        "Protected field": { "scope": "typescript", "prefix": "protected.field", "body": ["protected newField = undefined"] },
        "Protected readonly field": { "scope": "typescript", "prefix": "protected.readonly.field", "body": ["protected readonly newField = undefined"] },
        "Protected getter": { "scope": "typescript", "prefix": "protected.getter", "body": ["protected get newProperty() { return undefined }"] },
        "Protected setter": { "scope": "typescript", "prefix": "protected.setter", "body": ["protected set newProperty(_value: unknown) {}"] },
        "Protected method": { "scope": "typescript", "prefix": "protected.method", "body": ["protected newMethod() {}"] },
        "Protected async method": { "scope": "typescript", "prefix": "protected.async.method", "body": ["protected async newMethod() {}"] },
        "Protected abstract method": { "scope": "typescript", "prefix": "protected.abstract.method", "body": ["protected abstract newMethod(): unknown"] },

        // === PRIVATE ===
        "Private constructor": { "scope": "typescript", "prefix": "private.constructor", "body": ["private constructor() {}"] },
        "Private field": { "scope": "typescript", "prefix": "private.field", "body": ["private newField = undefined"] },
        "Private readonly field": { "scope": "typescript", "prefix": "private.readonly.field", "body": ["private readonly newField = undefined"] },
        "Private getter": { "scope": "typescript", "prefix": "private.getter", "body": ["private get newProperty() { return undefined }"] },
        "Private setter": { "scope": "typescript", "prefix": "private.setter", "body": ["private set newProperty(_value: unknown) {}"] },
        "Private method": { "scope": "typescript", "prefix": "private.method", "body": ["private newMethod() {}"] },
        "Private async method": { "scope": "typescript", "prefix": "private.async.method", "body": ["private async newMethod() {}"] },
        "Private abstract method": { "scope": "typescript", "prefix": "private.abstract.method", "body": ["private abstract newMethod(): unknown"] },

        // === PUBLIC STATIC ===
        "Public static field": { "scope": "typescript", "prefix": "public.static.field", "body": ["public static newField = undefined"] },
        "Public static readonly field": { "scope": "typescript", "prefix": "public.static.readonly.field", "body": ["public static readonly newField = undefined"] },
        "Public static getter": { "scope": "typescript", "prefix": "public.static.getter", "body": ["public static get newProperty() { return undefined }"] },
        "Public static setter": { "scope": "typescript", "prefix": "public.static.setter", "body": ["public static set newProperty(_value: unknown) {}"] },
        "Public static method": { "scope": "typescript", "prefix": "public.static.method", "body": ["public static newMethod() {}"] },
        "Public static async method": { "scope": "typescript", "prefix": "public.static.async.method", "body": ["public static async newMethod() {}"] },

        // === PROTECTED STATIC ===
        "Protected static field": { "scope": "typescript", "prefix": "protected.static.field", "body": ["protected static newField = undefined"] },
        "Protected static readonly field": { "scope": "typescript", "prefix": "protected.static.readonly.field", "body": ["protected static readonly newField = undefined"] },
        "Protected static getter": { "scope": "typescript", "prefix": "protected.static.getter", "body": ["protected static get newProperty() { return undefined }"] },
        "Protected static setter": { "scope": "typescript", "prefix": "protected.static.setter", "body": ["protected static set newProperty(_value: unknown) {}"] },
        "Protected static method": { "scope": "typescript", "prefix": "protected.static.method", "body": ["protected static newMethod() {}"] },
        "Protected static async method": { "scope": "typescript", "prefix": "protected.static.async.method", "body": ["protected static async newMethod() {}"] },

        // === PRIVATE STATIC ===
        "Private static field": { "scope": "typescript", "prefix": "private.static.field", "body": ["private static newField = undefined"] },
        "Private static readonly field": { "scope": "typescript", "prefix": "private.static.readonly.field", "body": ["private static readonly newField = undefined"] },
        "Private static getter": { "scope": "typescript", "prefix": "private.static.getter", "body": ["private static get newProperty() { return undefined }"] },
        "Private static setter": { "scope": "typescript", "prefix": "private.static.setter", "body": ["private static set newProperty(_value: unknown) {}"] },
        "Private static method": { "scope": "typescript", "prefix": "private.static.method", "body": ["private static newMethod() {}"] },
        "Private static async method": { "scope": "typescript", "prefix": "private.static.async.method", "body": ["private static async newMethod() {}"] }
    `.replace(/^[ \t]+/gm, '')

    private readonly indentedSnippets = this.snippets
        .split('\n')
        .map((line) => (line.trim() ? '    ' + line : line))
        .join('\n')

    private readonly keybindings = `
        // === PUBLIC (Ctrl+1) ===
        { "key": "ctrl+1 f1", "command": "editor.action.insertSnippet", "args": { "name": "Public constructor" } },
        { "key": "ctrl+1 f2", "command": "editor.action.insertSnippet", "args": { "name": "Public field" } },
        { "key": "ctrl+1 f3", "command": "editor.action.insertSnippet", "args": { "name": "Public readonly field" } },
        { "key": "ctrl+1 f4", "command": "editor.action.insertSnippet", "args": { "name": "Public getter" } },
        { "key": "ctrl+1 f5", "command": "editor.action.insertSnippet", "args": { "name": "Public setter" } },
        { "key": "ctrl+1 f6", "command": "editor.action.insertSnippet", "args": { "name": "Public method" } },
        { "key": "ctrl+1 f7", "command": "editor.action.insertSnippet", "args": { "name": "Public async method" } },
        { "key": "ctrl+1 f8", "command": "editor.action.insertSnippet", "args": { "name": "Public abstract method" } },

        // === PROTECTED (Ctrl+2) ===
        { "key": "ctrl+2 f1", "command": "editor.action.insertSnippet", "args": { "name": "Protected constructor" } },
        { "key": "ctrl+2 f2", "command": "editor.action.insertSnippet", "args": { "name": "Protected field" } },
        { "key": "ctrl+2 f3", "command": "editor.action.insertSnippet", "args": { "name": "Protected readonly field" } },
        { "key": "ctrl+2 f4", "command": "editor.action.insertSnippet", "args": { "name": "Protected getter" } },
        { "key": "ctrl+2 f5", "command": "editor.action.insertSnippet", "args": { "name": "Protected setter" } },
        { "key": "ctrl+2 f6", "command": "editor.action.insertSnippet", "args": { "name": "Protected method" } },
        { "key": "ctrl+2 f7", "command": "editor.action.insertSnippet", "args": { "name": "Protected async method" } },
        { "key": "ctrl+2 f8", "command": "editor.action.insertSnippet", "args": { "name": "Protected abstract method" } },

        // === PRIVATE (Ctrl+3) ===
        { "key": "ctrl+3 f1", "command": "editor.action.insertSnippet", "args": { "name": "Private constructor" } },
        { "key": "ctrl+3 f2", "command": "editor.action.insertSnippet", "args": { "name": "Private field" } },
        { "key": "ctrl+3 f3", "command": "editor.action.insertSnippet", "args": { "name": "Private readonly field" } },
        { "key": "ctrl+3 f4", "command": "editor.action.insertSnippet", "args": { "name": "Private getter" } },
        { "key": "ctrl+3 f5", "command": "editor.action.insertSnippet", "args": { "name": "Private setter" } },
        { "key": "ctrl+3 f6", "command": "editor.action.insertSnippet", "args": { "name": "Private method" } },
        { "key": "ctrl+3 f7", "command": "editor.action.insertSnippet", "args": { "name": "Private async method" } },
        { "key": "ctrl+3 f8", "command": "editor.action.insertSnippet", "args": { "name": "Private abstract method" } },

        // === PUBLIC STATIC (Ctrl+1 Alt) ===
        { "key": "ctrl+1 alt+f2", "command": "editor.action.insertSnippet", "args": { "name": "Public static field" } },
        { "key": "ctrl+1 alt+f3", "command": "editor.action.insertSnippet", "args": { "name": "Public static readonly field" } },
        { "key": "ctrl+1 alt+f4", "command": "editor.action.insertSnippet", "args": { "name": "Public static getter" } },
        { "key": "ctrl+1 alt+f5", "command": "editor.action.insertSnippet", "args": { "name": "Public static setter" } },
        { "key": "ctrl+1 alt+f6", "command": "editor.action.insertSnippet", "args": { "name": "Public static method" } },
        { "key": "ctrl+1 alt+f7", "command": "editor.action.insertSnippet", "args": { "name": "Public static async method" } },

        // === PROTECTED STATIC (Ctrl+2 Alt) ===
        { "key": "ctrl+2 alt+f2", "command": "editor.action.insertSnippet", "args": { "name": "Protected static field" } },
        { "key": "ctrl+2 alt+f3", "command": "editor.action.insertSnippet", "args": { "name": "Protected static readonly field" } },
        { "key": "ctrl+2 alt+f4", "command": "editor.action.insertSnippet", "args": { "name": "Protected static getter" } },
        { "key": "ctrl+2 alt+f5", "command": "editor.action.insertSnippet", "args": { "name": "Protected static setter" } },
        { "key": "ctrl+2 alt+f6", "command": "editor.action.insertSnippet", "args": { "name": "Protected static method" } },
        { "key": "ctrl+2 alt+f7", "command": "editor.action.insertSnippet", "args": { "name": "Protected static async method" } },

        // === PRIVATE STATIC (Ctrl+3 Alt) ===
        { "key": "ctrl+3 alt+f2", "command": "editor.action.insertSnippet", "args": { "name": "Private static field" } },
        { "key": "ctrl+3 alt+f3", "command": "editor.action.insertSnippet", "args": { "name": "Private static readonly field" } },
        { "key": "ctrl+3 alt+f4", "command": "editor.action.insertSnippet", "args": { "name": "Private static getter" } },
        { "key": "ctrl+3 alt+f5", "command": "editor.action.insertSnippet", "args": { "name": "Private static setter" } },
        { "key": "ctrl+3 alt+f6", "command": "editor.action.insertSnippet", "args": { "name": "Private static method" } },
        { "key": "ctrl+3 alt+f7", "command": "editor.action.insertSnippet", "args": { "name": "Private static async method" } }
    `.replace(/^[ \t]+/gm, '')
}

export interface SnippetSuite {
    install(): Promise<void>
}

export type SnippetSuiteConstructor = new () => SnippetSuite
