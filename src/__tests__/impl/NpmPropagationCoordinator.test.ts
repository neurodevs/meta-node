import { readFile } from 'node:fs/promises'

import {
    fakeReadFile,
    resetCallsToReadFile,
    setFakeReadFileResult,
} from '@neurodevs/fake-node-core'
import AbstractModuleTest, { test, assert } from '@neurodevs/node-tdd'

import NpmPropagationCoordinator, {
    PropagationCoordinator,
} from '../../impl/NpmPropagationCoordinator.js'
import NpmReleasePropagator, {
    PackageJson,
} from '../../impl/NpmReleasePropagator.js'
import FakeReleasePropagator from '../../testDoubles/ReleasePropagator/FakeReleasePropagator.js'

export default class NpmPropagationCoordinatorTest extends AbstractModuleTest {
    private static instance: PropagationCoordinator

    private static readonly packageScope = this.generateId()
    private static readonly packageName = this.generateId()
    private static readonly scopedName = `${this.packageScope}/${this.packageName}`
    private static readonly packageVersion = '7.8.9'
    private static readonly repoPath = `${this.generateId()}/${this.packageName}`

    private static readonly repoPaths = [
        this.generateId(),
        this.generateId(),
        this.generateId(),
        this.repoPath,
    ]

    private static readonly pkgJsons = [
        this.generatePackageJson({
            dependencies: { [this.scopedName]: '^1.2.3' },
        }),
        this.generatePackageJson({
            devDependencies: { [this.scopedName]: '^4.5.6' },
        }),
        this.generatePackageJson(),
        this.generatePackageJson({ version: this.packageVersion }),
    ]

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeReadFile()
        this.setFakeReleasePropagator()

        this.instance = this.NpmPropagationCoordinator()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async propagatesToCorrectRepoPaths() {
        await this.run()

        assert.isEqualDeep(
            FakeReleasePropagator.callsToConstructor[0],
            {
                packageName: this.scopedName,
                packageVersion: this.packageVersion,
                repoPaths: [this.repoPaths[0], this.repoPaths[1]],
            },
            'Incorrect repo paths propagated to!'
        )
    }

    private static async run() {
        await this.instance.run()
    }

    private static generatePackageJson(options?: Partial<PackageJson>) {
        return {
            name: this.scopedName,
            version: this.packageVersion,
            dependencies: {},
            devDependencies: {},
            ...options,
        }
    }

    private static setFakeReadFile() {
        NpmPropagationCoordinator.readFile =
            fakeReadFile as unknown as typeof readFile
        resetCallsToReadFile()

        this.repoPaths.forEach((repoPath, i) => {
            setFakeReadFileResult(
                `${repoPath}/package.json`,
                JSON.stringify(this.pkgJsons[i], null, 4)
            )
        })
    }

    private static setFakeReleasePropagator() {
        NpmReleasePropagator.Class = FakeReleasePropagator
        FakeReleasePropagator.resetTestDouble()
    }

    private static NpmPropagationCoordinator() {
        return NpmPropagationCoordinator.Create(this.repoPath, this.repoPaths)
    }
}
