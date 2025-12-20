import AbstractModuleTest, { test, assert } from '@neurodevs/node-tdd'

import NpmWorkspaceTypeChecker, {
    WorkspaceTypeChecker,
} from '../../impl/NpmWorkspaceTypeChecker.js'

export default class NpmWorkspaceTypeCheckerTest extends AbstractModuleTest {
    private static instance: WorkspaceTypeChecker

    private static readonly workspacePath = this.generateId()

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.NpmWorkspaceTypeChecker()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static NpmWorkspaceTypeChecker() {
        return NpmWorkspaceTypeChecker.Create(this.workspacePath)
    }
}
