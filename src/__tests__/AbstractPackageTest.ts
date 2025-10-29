import { setFakeReadFileResult } from '@neurodevs/fake-node-core'
import AbstractModuleTest from '@neurodevs/node-tdd'

import expandHomeDir from '../functions/expandHomeDir.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    protected static normalize(input: string) {
        return input.replace(/\s+/g, ' ').trim()
    }

    protected static readonly vscodeDir = expandHomeDir(
        '~/Library/Application Support/Code/User'
    )

    protected static get snippetsPath() {
        return `${this.vscodeDir}/snippets/custom.code-snippets`
    }

    protected static readonly originalSnippet = { [this.generateId()]: {} }

    protected static readonly originalSnippets = {
        ...this.originalSnippet,
    }

    protected static readonly originalSnippetsFile = JSON.stringify(
        this.originalSnippets,
        null,
        4
    )

    protected static get keybindingsPath() {
        return `${this.vscodeDir}/keybindings.json`
    }

    protected static readonly originalKeybinding = {
        key: this.generateId(),
        command: this.generateId(),
    }

    protected static readonly originalKeybindings = [this.originalKeybinding]

    protected static readonly originalKeybindingsFile = JSON.stringify(
        this.originalKeybindings,
        null,
        4
    )

    protected static setFakeSnippetsFile() {
        setFakeReadFileResult(this.snippetsPath, this.originalSnippetsFile)
    }

    protected static setFakeKeybindingsFile() {
        setFakeReadFileResult(
            this.keybindingsPath,
            this.originalKeybindingsFile
        )
    }
}
