import { WorkspaceTypeChecker } from '../../impl/NpmWorkspaceTypeChecker.js'

export default class FakeWorkspaceTypeChecker implements WorkspaceTypeChecker {
    public static callsToConstructor: (string | undefined)[] = []

    public constructor(workspacePath?: string) {
        FakeWorkspaceTypeChecker.callsToConstructor.push(workspacePath)
    }

    public static resetTestDouble() {
        FakeWorkspaceTypeChecker.callsToConstructor = []
    }
}
