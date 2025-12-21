import { WorkspaceTypeChecker } from '../../impl/NpmWorkspaceTypeChecker.js'

export default class FakeWorkspaceTypeChecker implements WorkspaceTypeChecker {
    public static callsToConstructor: (string | undefined)[] = []
    public static numCallsToRun = 0

    public constructor(workspacePath?: string) {
        FakeWorkspaceTypeChecker.callsToConstructor.push(workspacePath)
    }
    public async run() {
        FakeWorkspaceTypeChecker.numCallsToRun += 1
    }

    public static resetTestDouble() {
        FakeWorkspaceTypeChecker.callsToConstructor = []
        FakeWorkspaceTypeChecker.numCallsToRun = 0
    }
}
