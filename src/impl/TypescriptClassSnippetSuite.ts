import { readFile, writeFile } from 'fs/promises'
import expandHomeDir from '../functions/expandHomeDir.js'

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

        if (!this.hasKeybindMarkers) {
            await this.installFreshKeybindings()
        } else {
            await this.updateExistingKeybindings()
        }
    }

    private async loadKeybindingsFile() {
        return await this.readFile(this.keybindingsPath, 'utf-8')
    }

    private get keybindingsPath() {
        return `${this.vscodeDir}/keybindings.json`
    }

    private get hasKeybindMarkers() {
        return this.keybindStartIdx !== -1 && this.keybindEndIdx !== -1
    }

    private get keybindStartIdx() {
        return this.originalKeybindingsFile.indexOf(this.keybindStartMarker)
    }

    private get keybindEndIdx() {
        return (
            this.originalKeybindingsFile.indexOf(this.keybindEndMarker) +
            this.keybindEndMarker.length
        )
    }

    private async installFreshKeybindings() {
        await this.writeFile(this.keybindingsPath, this.freshKeybindingsFile)
    }

    private get freshKeybindingsFile() {
        const lastBraceIdx = this.originalKeybindingsFile.lastIndexOf(']')
        const before = this.originalKeybindingsFile.slice(0, lastBraceIdx)

        return `${before}${this.keybindingBlock}\n]`
    }

    private get keybindingBlock() {
        return `    ${this.keybindStartMarker}\n${this.indentedKeybindings}\n    ${this.keybindEndMarker}`
    }

    private keybindStartMarker = '// === TYPESCRIPT CLASS KEYBINDINGS BEGIN ==='
    private keybindEndMarker = '// === TYPESCRIPT CLASS KEYBINDINGS END ==='

    private async updateExistingKeybindings() {
        const before = this.originalKeybindingsFile.slice(
            0,
            this.keybindStartIdx
        )

        const existing = this.originalKeybindingsFile.slice(
            this.keybindStartIdx,
            this.keybindEndIdx
        )

        const after = this.originalKeybindingsFile.slice(this.keybindEndIdx)

        if (existing.trim() !== this.keybindingBlock.trim()) {
            await this.writeFile(
                this.keybindingsPath,
                `${before}${this.keybindingBlock}${after}`
            )
        }
    }

    private get readFile() {
        return TypescriptClassSnippetSuite.readFile
    }

    private get writeFile() {
        return TypescriptClassSnippetSuite.writeFile
    }

    private readonly snippets = `
        // === PUBLIC ===
        "Public constructor": { "scope": "typescript,typescriptreact", "prefix": "public.constructor", "body": ["public constructor(\${1:}) {\${2:} }"] },
        "Public field": { "scope": "typescript,typescriptreact", "prefix": "public.field", "body": ["public \${1:newField} = \${2:undefined}"] },
        "Public readonly field": { "scope": "typescript,typescriptreact", "prefix": "public.readonly.field", "body": ["public readonly \${1:newField} = \${2:undefined}"] },
        "Public getter": { "scope": "typescript,typescriptreact", "prefix": "public.getter", "body": ["public get \${1:newProperty}() { return \${2:undefined} }"] },
        "Public setter": { "scope": "typescript,typescriptreact", "prefix": "public.setter", "body": ["public set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Public method": { "scope": "typescript,typescriptreact", "prefix": "public.method", "body": ["public \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Public async method": { "scope": "typescript,typescriptreact", "prefix": "public.async.method", "body": ["public async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },
        "Public abstract method": { "scope": "typescript,typescriptreact", "prefix": "public.abstract.method", "body": ["public abstract \${1:newMethod}(\${2:}): \${3:unknown}"] },

        // === PROTECTED ===
        "Protected constructor": { "scope": "typescript,typescriptreact", "prefix": "protected.constructor", "body": ["protected constructor(\${1:}) {\${2:} }"] },
        "Protected field": { "scope": "typescript,typescriptreact", "prefix": "protected.field", "body": ["protected \${1:newField} = \${2:undefined}"] },
        "Protected readonly field": { "scope": "typescript,typescriptreact", "prefix": "protected.readonly.field", "body": ["protected readonly \${1:newField} = \${2:undefined}"] },
        "Protected getter": { "scope": "typescript,typescriptreact", "prefix": "protected.getter", "body": ["protected get \${1:newProperty}() { return \${2:undefined} }"] },
        "Protected setter": { "scope": "typescript,typescriptreact", "prefix": "protected.setter", "body": ["protected set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Protected method": { "scope": "typescript,typescriptreact", "prefix": "protected.method", "body": ["protected \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Protected async method": { "scope": "typescript,typescriptreact", "prefix": "protected.async.method", "body": ["protected async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },
        "Protected abstract method": { "scope": "typescript,typescriptreact", "prefix": "protected.abstract.method", "body": ["protected abstract \${1:newMethod}(\${2:}): \${3:unknown}"] },

        // === PRIVATE ===
        "Private constructor": { "scope": "typescript,typescriptreact", "prefix": "private.constructor", "body": ["private constructor(\${1:}) {\${2:} }"] },
        "Private field": { "scope": "typescript,typescriptreact", "prefix": "private.field", "body": ["private \${1:newField} = \${2:undefined}"] },
        "Private readonly field": { "scope": "typescript,typescriptreact", "prefix": "private.readonly.field", "body": ["private readonly \${1:newField} = \${2:undefined}"] },
        "Private getter": { "scope": "typescript,typescriptreact", "prefix": "private.getter", "body": ["private get \${1:newProperty}() { return \${2:undefined} }"] },
        "Private setter": { "scope": "typescript,typescriptreact", "prefix": "private.setter", "body": ["private set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Private method": { "scope": "typescript,typescriptreact", "prefix": "private.method", "body": ["private \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Private async method": { "scope": "typescript,typescriptreact", "prefix": "private.async.method", "body": ["private async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },
        "Private abstract method": { "scope": "typescript,typescriptreact", "prefix": "private.abstract.method", "body": ["private abstract \${1:newMethod}(\${2:}): \${3:unknown}"] },

        // === PUBLIC STATIC ===
        "Public static field": { "scope": "typescript,typescriptreact", "prefix": "public.static.field", "body": ["public static \${1:newField} = \${2:undefined}"] },
        "Public static readonly field": { "scope": "typescript,typescriptreact", "prefix": "public.static.readonly.field", "body": ["public static readonly \${1:newField} = \${2:undefined}"] },
        "Public static getter": { "scope": "typescript,typescriptreact", "prefix": "public.static.getter", "body": ["public static get \${1:newProperty}() { return \${2:undefined} }"] },
        "Public static setter": { "scope": "typescript,typescriptreact", "prefix": "public.static.setter", "body": ["public static set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Public static method": { "scope": "typescript,typescriptreact", "prefix": "public.static.method", "body": ["public static \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Public static async method": { "scope": "typescript,typescriptreact", "prefix": "public.static.async.method", "body": ["public static async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },

        // === PROTECTED STATIC ===
        "Protected static field": { "scope": "typescript,typescriptreact", "prefix": "protected.static.field", "body": ["protected static \${1:newField} = \${2:undefined}"] },
        "Protected static readonly field": { "scope": "typescript,typescriptreact", "prefix": "protected.static.readonly.field", "body": ["protected static readonly \${1:newField} = \${2:undefined}"] },
        "Protected static getter": { "scope": "typescript,typescriptreact", "prefix": "protected.static.getter", "body": ["protected static get \${1:newProperty}() { return \${2:undefined} }"] },
        "Protected static setter": { "scope": "typescript,typescriptreact", "prefix": "protected.static.setter", "body": ["protected static set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Protected static method": { "scope": "typescript,typescriptreact", "prefix": "protected.static.method", "body": ["protected static \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Protected static async method": { "scope": "typescript,typescriptreact", "prefix": "protected.static.async.method", "body": ["protected static async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },

        // === PRIVATE STATIC ===
        "Private static field": { "scope": "typescript,typescriptreact", "prefix": "private.static.field", "body": ["private static \${1:newField} = \${2:undefined}"] },
        "Private static readonly field": { "scope": "typescript,typescriptreact", "prefix": "private.static.readonly.field", "body": ["private static readonly \${1:newField} = \${2:undefined}"] },
        "Private static getter": { "scope": "typescript,typescriptreact", "prefix": "private.static.getter", "body": ["private static get \${1:newProperty}() { return \${2:undefined} }"] },
        "Private static setter": { "scope": "typescript,typescriptreact", "prefix": "private.static.setter", "body": ["private static set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Private static method": { "scope": "typescript,typescriptreact", "prefix": "private.static.method", "body": ["private static \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Private static async method": { "scope": "typescript,typescriptreact", "prefix": "private.static.async.method", "body": ["private static async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] }
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

    private readonly indentedKeybindings = this.keybindings
        .split('\n')
        .map((line) => (line.trim() ? '    ' + line : line))
        .join('\n')
}

export interface SnippetSuite {
    install(): Promise<void>
}

export type SnippetSuiteConstructor = new () => SnippetSuite
