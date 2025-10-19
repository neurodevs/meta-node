import { readFile, writeFile } from 'fs/promises'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import {
    callsToWriteFile,
    fakeReadFile,
    fakeWriteFile,
    resetCallsToReadFile,
    resetCallsToWriteFile,
    setFakeReadFileResult,
} from '@neurodevs/fake-node-core'
import VscodeSnippetKeybinder, {
    SnippetKeybinder,
} from '../../modules/VscodeSnippetKeybinder'
import AbstractPackageTest from '../AbstractPackageTest'

export default class VscodeSnippetKeybinderTest extends AbstractPackageTest {
    private static instance: SnippetKeybinder

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeReadFile()
        this.setFakeWriteFile()

        this.instance = this.VscodeSnippetKeybinder()
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

        await this.instance.run()

        assert.isEqualDeep(callsToWriteFile[0], {
            file: this.snippetsPath,
            data: JSON.stringify(this.updatedSnippetsFile, null, 4),
            options: undefined,
        })
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

    private static readonly vscodeDir =
        '~/Library/Application Support/Code/User'

    private static get snippetsPath() {
        return `${this.vscodeDir}/snippets/custom.code-snippets`
    }

    private static readonly originalSnippet = { [generateId()]: {} }

    private static readonly originalSnippetsFile = {
        ...this.originalSnippet,
    }

    private static get updatedSnippetsFile() {
        return {
            ...this.originalSnippet,
            [this.fakeName]: {
                scope: 'javascript,typescript',
                prefix: this.fakePrefix,
                body: this.fakeLines,
                description: this.fakeDescription,
            },
        }
    }

    private static readonly fakeName = `${generateId()}-${generateId()}_${generateId()} ${generateId()}`
    private static readonly fakePrefix = this.toCommandId(this.fakeName)
    private static readonly fakeLines = [generateId(), generateId()]
    private static readonly fakeKeybinding = generateId()
    private static readonly fakeDescription = generateId()

    private static toCommandId(name: string) {
        return name
            .trim()
            .toLowerCase()
            .replace(/[-_\s]+/g, '.')
            .replace(/[^a-z0-9.]/g, '')
            .replace(/\.+/g, '.')
            .replace(/^\.+|\.+$/g, '')
    }

    private static VscodeSnippetKeybinder() {
        return VscodeSnippetKeybinder.Create({
            name: this.fakeName,
            description: this.fakeDescription,
            lines: this.fakeLines,
            keybinding: this.fakeKeybinding,
        })
    }
}
