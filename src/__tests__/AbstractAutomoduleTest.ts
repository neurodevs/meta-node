import { exec as execSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { promisify } from 'util'
import {
    fakeExec,
    fakePathExists,
    fakeReadFile,
    fakeWriteFile,
    resetCallsToExec,
    resetCallsToPathExists,
    resetCallsToReadFile,
    resetCallsToWriteFile,
    setPathShouldExist,
} from '@neurodevs/fake-node-core'
import { assert } from '@neurodevs/node-tdd'

import AbstractAutomodule from '../impl/AbstractAutomodule.js'
import { Automodule } from '../types.js'
import AbstractPackageTest from './AbstractPackageTest.js'

const exec = promisify(execSync)

export default class AbstractAutomoduleTest extends AbstractPackageTest {
    protected static instance: Automodule

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeExec()
        this.setFakePathExists()
        this.setFakeReadFile()
        this.setFakeWriteFile()
    }

    protected static async runAbstractTests() {
        await this.runThrowsIfTestSaveDirMissing()
        await this.runThrowsIfModuleSaveDirMissing()
        await this.runThrowsIfFakeSaveDirMissing()
    }

    protected static async runThrowsIfTestSaveDirMissing() {
        setPathShouldExist(this.testSaveDir, false)

        await assert.doesThrowAsync(
            async () => await this.run(),
            `testSaveDir does not exist: ${this.testSaveDir}!`
        )
    }

    protected static async runThrowsIfModuleSaveDirMissing() {
        setPathShouldExist(this.testSaveDir, true)
        setPathShouldExist(this.moduleSaveDir, false)

        await assert.doesThrowAsync(
            async () => await this.run(),
            `moduleSaveDir does not exist: ${this.moduleSaveDir}!`
        )
    }

    protected static async runThrowsIfFakeSaveDirMissing() {
        setPathShouldExist(this.moduleSaveDir, true)
        setPathShouldExist(this.fakeSaveDir, false)

        await assert.doesThrowAsync(
            async () => await this.run(),
            `fakeSaveDir does not exist: ${this.fakeSaveDir}!`
        )
    }

    protected static async run() {
        return this.instance.run()
    }

    protected static readonly testSaveDir = this.generateId()
    protected static readonly moduleSaveDir = this.generateId()
    protected static readonly fakeSaveDir = this.generateId()
    protected static readonly indexFilePath = './src/index.ts'

    protected static readonly originalIndexFile = `
        // C-${this.generateId()}
        
        // A-${this.generateId()}
    `

    protected static setFakeExec() {
        AbstractAutomodule.exec = fakeExec as unknown as typeof exec
        resetCallsToExec()
    }

    protected static setFakePathExists() {
        AbstractAutomodule.pathExists = fakePathExists

        setPathShouldExist(this.testSaveDir, true)
        setPathShouldExist(this.moduleSaveDir, true)
        setPathShouldExist(this.fakeSaveDir, true)
        setPathShouldExist(this.indexFilePath, true)

        resetCallsToPathExists()
    }

    protected static setFakeReadFile() {
        AbstractAutomodule.readFile = fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()
    }

    protected static setFakeWriteFile() {
        AbstractAutomodule.writeFile = fakeWriteFile as typeof writeFile
        resetCallsToWriteFile()
    }
}
