import AbstractModuleTest, { test, assert } from '@neurodevs/node-tdd'

import NpmReleasePropagator, {
    ReleasePropagator,
    ReleasePropagatorOptions,
} from '../../impl/NpmReleasePropagator.js'

export default class NpmReleasePropagatorTest extends AbstractModuleTest {
    private static instance: ReleasePropagator

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.NpmReleasePropagator()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static readonly packageName = this.generateId()
    private static readonly packageVersion = this.generateId()
    private static readonly repoPaths = [this.generateId(), this.generateId()]

    private static NpmReleasePropagator(
        options?: Partial<ReleasePropagatorOptions>
    ) {
        return NpmReleasePropagator.Create({
            packageName: this.packageName,
            packageVersion: this.packageVersion,
            repoPaths: this.repoPaths,
            ...options,
        })
    }
}
