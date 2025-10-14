import { assert, generateId } from '@sprucelabs/test-utils'
import {
    fakePathExists,
    resetCallsToPathExists,
    setPathShouldExist,
} from '@neurodevs/fake-node-core'
import ImplAutomodule from '../modules/ImplAutomodule'
import UiAutomodule from '../modules/UiAutomodule'
import { Automodule } from '../types'
import AbstractPackageTest from './AbstractPackageTest'

export default class AbstractAutomoduleTest extends AbstractPackageTest {
    protected static instance: Automodule

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakePathExists()
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

    protected static readonly testSaveDir = generateId()
    protected static readonly moduleSaveDir = generateId()
    protected static readonly fakeSaveDir = generateId()
    protected static readonly indexFilePath = './src/index.ts'

    protected static setFakePathExists() {
        ImplAutomodule.pathExists = fakePathExists
        UiAutomodule.pathExists = fakePathExists

        setPathShouldExist(this.testSaveDir, true)
        setPathShouldExist(this.moduleSaveDir, true)
        setPathShouldExist(this.fakeSaveDir, true)
        setPathShouldExist(this.indexFilePath, true)

        resetCallsToPathExists()
    }
}
