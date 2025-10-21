import { readFile, writeFile } from 'fs/promises'
import { test, assert } from '@sprucelabs/test-utils'
import {
    callsToWriteFile,
    fakeReadFile,
    fakeWriteFile,
    resetCallsToReadFile,
    resetCallsToWriteFile,
    setFakeReadFileResult,
} from '@neurodevs/fake-node-core'
import TypescriptClassSnippetSuite, {
    SnippetSuite,
} from '../../impl/TypescriptClassSnippetSuite'
import AbstractPackageTest from '../AbstractPackageTest'

export default class TypescriptClassSnippetSuiteTest extends AbstractPackageTest {
    private static instance: SnippetSuite

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeReadFile()
        this.setFakeWriteFile()
        this.setFakeSnippetsFile()
        this.setFakeKeybindingsFile()

        this.instance = this.TypescriptClassSnippetSuite()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async updatesGlobalSnippetsInVscode() {
        await this.instance.install()

        assert.isEqualDeep(
            callsToWriteFile[0],
            {
                file: this.snippetsPath,
                data: this.updatedSnippetsFile,
                options: undefined,
            },
            'Written snippets file is incorrect!'
        )
    }

    @test()
    protected static async doesNotWriteSnippetsFileIfContentsAreIdentical() {
        setFakeReadFileResult(this.snippetsPath, this.updatedSnippetsFile)

        await this.instance.install()

        assert.isEqual(
            callsToWriteFile.filter((call) => call.file === this.snippetsPath)
                .length,
            0,
            'Should not have written snippets file!'
        )
    }

    @test()
    protected static async updatesGlobalKeybindingsInVscode() {
        await this.install()

        assert.isEqualDeep(
            callsToWriteFile[1],
            {
                file: this.keybindingsPath,
                data: this.updatedKeybindingsFile,
                options: undefined,
            },
            'Written keybindings file is incorrect!'
        )
    }

    @test()
    protected static async doesNotWriteKeybindingsFileIfContentsAreIdentical() {
        setFakeReadFileResult(this.keybindingsPath, this.updatedKeybindingsFile)

        await this.install()

        assert.isEqual(
            callsToWriteFile.filter(
                (call) => call.file === this.keybindingsPath
            ).length,
            0,
            'Should not have written keybindings file!'
        )
    }

    private static async install() {
        return this.instance.install()
    }

    private static setFakeReadFile() {
        TypescriptClassSnippetSuite.readFile =
            fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()
    }

    private static setFakeWriteFile() {
        TypescriptClassSnippetSuite.writeFile =
            fakeWriteFile as unknown as typeof writeFile
        resetCallsToWriteFile()
    }

    private static get updatedSnippetsFile() {
        const lastBraceIdx = this.originalSnippetsFile.lastIndexOf('}')
        const before = this.originalSnippetsFile.slice(0, lastBraceIdx)

        return `${before}${this.snippetsBlock}\n}`
    }

    private static get snippetsBlock() {
        return `    ${this.snippetStartMarker}\n${this.indentedSnippets}\n    ${this.snippetEndMarker}`
    }

    private static readonly snippetStartMarker =
        '// === TYPESCRIPT CLASS SNIPPETS BEGIN ==='

    private static readonly snippetEndMarker =
        '// === TYPESCRIPT CLASS SNIPPETS END ==='

    private static get updatedKeybindingsFile() {
        const lastBraceIdx = this.originalKeybindingsFile.lastIndexOf(']')
        const before = this.originalKeybindingsFile.slice(0, lastBraceIdx)

        return `${before}${this.keybindingBlock}\n]`
    }

    private static get keybindingBlock() {
        return `    ${this.keybindingStartMarker}\n${this.indentedKeybindings}\n    ${this.keybindingEndMarker}`
    }

    private static readonly keybindingStartMarker =
        '// === TYPESCRIPT CLASS KEYBINDINGS BEGIN ==='

    private static readonly keybindingEndMarker =
        '// === TYPESCRIPT CLASS KEYBINDINGS END ==='

    private static readonly snippets = `
        // === PUBLIC ===
        "Public constructor": { "scope": "typescript", "prefix": "public.constructor", "body": ["public constructor(\${1:args}) {\${2:} }"] },
        "Public field": { "scope": "typescript", "prefix": "public.field", "body": ["public \${1:newField} = \${2:undefined}"] },
        "Public readonly field": { "scope": "typescript", "prefix": "public.readonly.field", "body": ["public readonly \${1:newField} = \${2:undefined}"] },
        "Public getter": { "scope": "typescript", "prefix": "public.getter", "body": ["public get \${1:newProperty}() { return \${2:undefined} }"] },
        "Public setter": { "scope": "typescript", "prefix": "public.setter", "body": ["public set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Public method": { "scope": "typescript", "prefix": "public.method", "body": ["public \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Public async method": { "scope": "typescript", "prefix": "public.async.method", "body": ["public async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },
        "Public abstract method": { "scope": "typescript", "prefix": "public.abstract.method", "body": ["public abstract \${1:newMethod}(\${2:}): \${3:unknown}"] },

        // === PROTECTED ===
        "Protected constructor": { "scope": "typescript", "prefix": "protected.constructor", "body": ["protected constructor(\${1:args}) {\${2:} }"] },
        "Protected field": { "scope": "typescript", "prefix": "protected.field", "body": ["protected \${1:newField} = \${2:undefined}"] },
        "Protected readonly field": { "scope": "typescript", "prefix": "protected.readonly.field", "body": ["protected readonly \${1:newField} = \${2:undefined}"] },
        "Protected getter": { "scope": "typescript", "prefix": "protected.getter", "body": ["protected get \${1:newProperty}() { return \${2:undefined} }"] },
        "Protected setter": { "scope": "typescript", "prefix": "protected.setter", "body": ["protected set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Protected method": { "scope": "typescript", "prefix": "protected.method", "body": ["protected \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Protected async method": { "scope": "typescript", "prefix": "protected.async.method", "body": ["protected async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },
        "Protected abstract method": { "scope": "typescript", "prefix": "protected.abstract.method", "body": ["protected abstract \${1:newMethod}(\${2:}): \${3:unknown}"] },

        // === PRIVATE ===
        "Private constructor": { "scope": "typescript", "prefix": "private.constructor", "body": ["private constructor(\${1:args}) {\${2:} }"] },
        "Private field": { "scope": "typescript", "prefix": "private.field", "body": ["private \${1:newField} = \${2:undefined}"] },
        "Private readonly field": { "scope": "typescript", "prefix": "private.readonly.field", "body": ["private readonly \${1:newField} = \${2:undefined}"] },
        "Private getter": { "scope": "typescript", "prefix": "private.getter", "body": ["private get \${1:newProperty}() { return \${2:undefined} }"] },
        "Private setter": { "scope": "typescript", "prefix": "private.setter", "body": ["private set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Private method": { "scope": "typescript", "prefix": "private.method", "body": ["private \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Private async method": { "scope": "typescript", "prefix": "private.async.method", "body": ["private async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },
        "Private abstract method": { "scope": "typescript", "prefix": "private.abstract.method", "body": ["private abstract \${1:newMethod}(\${2:}): \${3:unknown}"] },

        // === PUBLIC STATIC ===
        "Public static field": { "scope": "typescript", "prefix": "public.static.field", "body": ["public static \${1:newField} = \${2:undefined}"] },
        "Public static readonly field": { "scope": "typescript", "prefix": "public.static.readonly.field", "body": ["public static readonly \${1:newField} = \${2:undefined}"] },
        "Public static getter": { "scope": "typescript", "prefix": "public.static.getter", "body": ["public static get \${1:newProperty}() { return \${2:undefined} }"] },
        "Public static setter": { "scope": "typescript", "prefix": "public.static.setter", "body": ["public static set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Public static method": { "scope": "typescript", "prefix": "public.static.method", "body": ["public static \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Public static async method": { "scope": "typescript", "prefix": "public.static.async.method", "body": ["public static async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },

        // === PROTECTED STATIC ===
        "Protected static field": { "scope": "typescript", "prefix": "protected.static.field", "body": ["protected static \${1:newField} = \${2:undefined}"] },
        "Protected static readonly field": { "scope": "typescript", "prefix": "protected.static.readonly.field", "body": ["protected static readonly \${1:newField} = \${2:undefined}"] },
        "Protected static getter": { "scope": "typescript", "prefix": "protected.static.getter", "body": ["protected static get \${1:newProperty}() { return \${2:undefined} }"] },
        "Protected static setter": { "scope": "typescript", "prefix": "protected.static.setter", "body": ["protected static set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Protected static method": { "scope": "typescript", "prefix": "protected.static.method", "body": ["protected static \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Protected static async method": { "scope": "typescript", "prefix": "protected.static.async.method", "body": ["protected static async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] },

        // === PRIVATE STATIC ===
        "Private static field": { "scope": "typescript", "prefix": "private.static.field", "body": ["private static \${1:newField} = \${2:undefined}"] },
        "Private static readonly field": { "scope": "typescript", "prefix": "private.static.readonly.field", "body": ["private static readonly \${1:newField} = \${2:undefined}"] },
        "Private static getter": { "scope": "typescript", "prefix": "private.static.getter", "body": ["private static get \${1:newProperty}() { return \${2:undefined} }"] },
        "Private static setter": { "scope": "typescript", "prefix": "private.static.setter", "body": ["private static set \${1:newProperty}(\${2:_value}: \${3:unknown}) {\${4:} }"] },
        "Private static method": { "scope": "typescript", "prefix": "private.static.method", "body": ["private static \${1:newMethod}(\${2:}): \${3:void} {\${4:} }"] },
        "Private static async method": { "scope": "typescript", "prefix": "private.static.async.method", "body": ["private static async \${1:newMethod}(\${2:}): \${3:Promise<unknown>} {\${4:} }"] }
    `.replace(/^[ \t]+/gm, '')

    private static readonly indentedSnippets = this.snippets
        .split('\n')
        .map((line) => (line.trim() ? '    ' + line : line))
        .join('\n')

    private static readonly keybindings = `
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

    private static readonly indentedKeybindings = this.keybindings
        .split('\n')
        .map((line) => (line.trim() ? '    ' + line : line))
        .join('\n')

    private static TypescriptClassSnippetSuite() {
        return TypescriptClassSnippetSuite.Create()
    }
}
