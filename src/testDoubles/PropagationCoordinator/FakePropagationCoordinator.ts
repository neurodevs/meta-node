import {
    PropagationCoordinator,
    PropagationCoordinatorOptions,
} from '../../impl/NpmPropagationCoordinator.js'

export default class FakePropagationCoordinator
    implements PropagationCoordinator
{
    public static callsToConstructor: {
        repoPath?: string
        repoPaths?: string[]
        options?: PropagationCoordinatorOptions
    }[] = []

    public static numCallsToRun = 0

    public constructor(
        repoPath?: string,
        repoPaths?: string[],
        options?: PropagationCoordinatorOptions
    ) {
        FakePropagationCoordinator.callsToConstructor.push({
            repoPath,
            repoPaths,
            options,
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
