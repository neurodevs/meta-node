import { readFile } from 'node:fs/promises'

import {
    fakeReadFile,
    resetCallsToReadFile,
    setFakeReadFileResult,
} from '@neurodevs/fake-node-core'
import { test, assert } from '@neurodevs/node-tdd'

import NpmPropagationCoordinator, {
    PropagationCoordinator,
    PropagationCoordinatorOptions,
} from '../../impl/NpmPropagationCoordinator.js'
import NpmReleasePropagator from '../../impl/NpmReleasePropagator.js'
import FakeReleasePropagator from '../../testDoubles/ReleasePropagator/FakeReleasePropagator.js'

import AbstractPackageTest from '../AbstractPackageTest.js'

export default class NpmPropagationCoordinatorTest extends AbstractPackageTest {
    private static instance: PropagationCoordinator

    private static readonly repoPath = `${this.generateId()}/${this.packageName}`

    private static readonly repoPaths = [
        this.generateId(),
        this.generateId(),
        this.generateId(),
        this.generateId(),
        this.repoPath,
    ]

    private static readonly pkgJsons = [
        this.generatePackageJson({
            dependencies: { [this.scopedName]: '^2.0.1' },
        }),
        this.generatePackageJson({
            devDependencies: { [this.scopedName]: '^2.1.0' },
        }),
        this.generatePackageJson({
            dependencies: { [this.scopedName]: '^1.0.0' },
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

    @test()
    protected static async propagatesMajorsIfPassedOptionalParameter() {
        const instance = this.NpmPropagationCoordinator({
            shouldPropagateMajors: true,
        })

        await instance.run()

        assert.isEqualDeep(
            FakeReleasePropagator.callsToConstructor[0],
            {
                packageName: this.scopedName,
                packageVersion: this.packageVersion,
                repoPaths: [
                    this.repoPaths[0],
                    this.repoPaths[1],
                    this.repoPaths[2],
                ],
            },
            'Did not propagate majors!'
        )
    }

    private static async run() {
        await this.instance.run()
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

    private static NpmPropagationCoordinator(
        options?: PropagationCoordinatorOptions
    ) {
        return NpmPropagationCoordinator.Create(
            this.repoPath,
            this.repoPaths,
            options
        )
    }
}
