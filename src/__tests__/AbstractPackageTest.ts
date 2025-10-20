import AbstractSpruceTest, { generateId } from '@sprucelabs/test-utils'
import { setFakeReadFileResult } from '@neurodevs/fake-node-core'
import expandHomeDir from '../scripts/expandHomeDir'

export default class AbstractPackageTest extends AbstractSpruceTest {
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

    protected static readonly originalSnippet = { [generateId()]: {} }

    protected static readonly originalSnippetsFile = {
        ...this.originalSnippet,
    }

    protected static get keybindingsPath() {
        return `${this.vscodeDir}/keybindings.json`
    }

    protected static readonly originalKeybinding = {
        key: generateId(),
        command: generateId(),
    }

    protected static readonly originalKeybindingsFile = [
        this.originalKeybinding,
    ]

    protected static setFakeSnippetsFile() {
        setFakeReadFileResult(
            this.snippetsPath,
            JSON.stringify(this.originalSnippetsFile, null, 4)
        )
    }

    protected static setFakeKeybindingsFile() {
        setFakeReadFileResult(
            this.keybindingsPath,
            JSON.stringify(this.originalKeybindingsFile, null, 4)
        )
    }
}
