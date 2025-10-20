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

        this.instance = this.TypescriptClassSnippetSuite()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async updatesGlobalSnippetsInVscode() {
        setFakeReadFileResult(
            this.snippetsPath,
            JSON.stringify(this.originalSnippetsFile, null, 4)
        )

        await this.instance.install()

        assert.isEqualDeep(callsToWriteFile[0], {
            file: this.snippetsPath,
            data: JSON.stringify(this.updatedSnippetsFile, null, 4),
            options: undefined,
        })
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
        return {
            ...this.originalSnippetsFile,

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
                body: [
                    'protected static get newProperty() { return undefined }',
                ],
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

    private static TypescriptClassSnippetSuite() {
        return TypescriptClassSnippetSuite.Create()
    }
}
