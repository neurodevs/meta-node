import { PropagationCoordinator } from '../../impl/NpmPropagationCoordinator.js'

export default class FakePropagationCoordinator
    implements PropagationCoordinator
{
    public static callsToConstructor: {
        repoPath?: string
        repoPaths?: string[]
    }[] = []

    public static numCallsToRun = 0

    public constructor(repoPath?: string, repoPaths?: string[]) {
        FakePropagationCoordinator.callsToConstructor.push({
            repoPath,
            repoPaths,
        })
    }

    public async run() {
        FakePropagationCoordinator.numCallsToRun += 1
    }

    public static resetTestDouble() {
        FakePropagationCoordinator.callsToConstructor = []
        FakePropagationCoordinator.numCallsToRun = 0
    }
}
