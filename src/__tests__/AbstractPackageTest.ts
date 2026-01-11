import { ChildProcess } from 'child_process'
import path from 'path'
import {
    setFakeExecResult,
    setFakeReadFileResult,
} from '@neurodevs/fake-node-core'
import { generateShortId } from '@neurodevs/generate-id'
import AbstractModuleTest from '@neurodevs/node-tdd'

import expandHomeDir from '../functions/expandHomeDir.js'
import { PackageJson } from '../impl/NpmReleasePropagator.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static readonly packageScope = this.generateId()
    protected static readonly packageName = this.generateId()
    protected static readonly scopedName = `${this.packageScope}/${this.packageName}`
    protected static readonly packageVersion = '2.2.0' // Dummy value in tests to handle necessary cases

    protected static readonly yarnGlobalDirCmd = 'yarn global dir'
    protected static readonly fakeGlobalRoot = this.generateId()
    protected static readonly metaNodeVersion = this.generateId()

    protected static async beforeEach() {
        await super.beforeEach()
    }

    protected static generatePackageJson(options?: Partial<PackageJson>) {
        return {
            name: this.scopedName,
            version: this.packageVersion,
            dependencies: {},
            devDependencies: {},
            ...options,
        }
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

    protected static setFakeKeybindingsFile() {
        setFakeReadFileResult(
            this.keybindingsPath,
            this.originalKeybindingsFile
        )
    }

    protected static setFakeMetaNodeVersion() {
        setFakeExecResult(this.yarnGlobalDirCmd, {
            stdout: this.fakeGlobalRoot,
        } as unknown as ChildProcess)

        setFakeReadFileResult(
            path.join(
                this.fakeGlobalRoot,
                'node_modules',
                '@neurodevs',
                'meta-node',
                'package.json'
            ),
            JSON.stringify({ version: this.metaNodeVersion })
        )
    }

    protected static setFakeSnippetsFile() {
        setFakeReadFileResult(this.snippetsPath, this.originalSnippetsFile)
    }

    protected static generateId() {
        return generateShortId()
    }
}
