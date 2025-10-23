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
import generateId from '@neurodevs/generate-id'
import VscodeSnippetKeybinder, {
    SnippetKeybinder,
} from '../../impl/VscodeSnippetKeybinder'
import AbstractPackageTest from '../AbstractPackageTest'

export default class VscodeSnippetKeybinderTest extends AbstractPackageTest {
    private static instance: SnippetKeybinder

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeReadFile()
        this.setFakeWriteFile()
        this.setFakeSnippetsFile()
        this.setFakeKeybindingsFile()

        this.instance = this.VscodeSnippetKeybinder()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async updatesGlobalSnippetsInVscode() {
        await this.run()

        assert.isEqualDeep(callsToWriteFile[0], {
            file: this.snippetsPath,
            data: JSON.stringify(this.updatedSnippetsFile, null, 4),
            options: undefined,
        })
    }

    @test()
    protected static async updatesGlobalKeybindingsInVscode() {
        await this.run()

        assert.isEqualDeep(callsToWriteFile[1], {
            file: this.keybindingsPath,
            data: JSON.stringify(this.updatedKeybindingsFile, null, 4),
            options: undefined,
        })
    }

    @test()
    protected static async updateSnippetsUsesJsoncParserToAllowComments() {
        setFakeReadFileResult(
            this.snippetsPath,
            this.originalSnippetsFileCommented
        )

        await this.run()

        assert.isEqualDeep(callsToWriteFile[0], {
            file: this.snippetsPath,
            data: JSON.stringify(this.updatedSnippetsFile, null, 4),
            options: undefined,
        })
    }

    @test()
    protected static async updateKeybindingsUsesJsoncParserToAllowComments() {
        setFakeReadFileResult(
            this.keybindingsPath,
            this.originalKeybindingsFileCommented
        )

        await this.run()

        assert.isEqualDeep(callsToWriteFile[1], {
            file: this.keybindingsPath,
            data: JSON.stringify(this.updatedKeybindingsFile, null, 4),
            options: undefined,
        })
    }

    private static async run() {
        await this.instance.run()
    }

    private static toCommandId(name: string) {
        return name
            .trim()
            .toLowerCase()
            .replace(/[-_\s]+/g, '.')
            .replace(/[^a-z0-9.]/g, '')
            .replace(/\.+/g, '.')
            .replace(/^\.+|\.+$/g, '')
    }

    private static setFakeReadFile() {
        VscodeSnippetKeybinder.readFile =
            fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()
    }

    private static setFakeWriteFile() {
        VscodeSnippetKeybinder.writeFile =
            fakeWriteFile as unknown as typeof writeFile
        resetCallsToWriteFile()
    }

    private static readonly fakeName = `${generateId()}-${generateId()}_${generateId()} ${generateId()}`
    private static readonly fakePrefix = this.toCommandId(this.fakeName)
    private static readonly fakeLines = [generateId(), generateId()]
    private static readonly fakeKeybinding = generateId()
    private static readonly fakeDescription = generateId()

    private static get updatedSnippetsFile() {
        return {
            ...this.originalSnippet,
            [this.fakeName]: {
                scope: 'stypescript,typescriptreact',
                prefix: this.fakePrefix,
                body: this.fakeLines,
                description: this.fakeDescription,
            },
        }
    }

    private static readonly originalSnippetsFileCommented = `
        // ${generateId()}
        ${JSON.stringify(this.originalSnippets, null, 4)}
    `

    private static readonly updatedKeybindingsFile = [
        this.originalKeybinding,
        {
            key: this.fakeKeybinding,
            command: 'editor.action.insertSnippet',
            when: 'editorTextFocus',
            args: {
                name: this.fakeName,
            },
        },
    ]

    private static readonly originalKeybindingsFileCommented = `
        // ${generateId()}
        ${JSON.stringify(this.originalKeybindings, null, 4)}
    `

    private static VscodeSnippetKeybinder() {
        return VscodeSnippetKeybinder.Create({
            name: this.fakeName,
            description: this.fakeDescription,
            lines: this.fakeLines,
            keybinding: this.fakeKeybinding,
        })
    }
}
