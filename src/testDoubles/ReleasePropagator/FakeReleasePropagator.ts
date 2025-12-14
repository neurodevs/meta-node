import {
    ReleasePropagator,
    ReleasePropagatorOptions,
} from '../../impl/NpmReleasePropagator.js'

export default class FakeReleasePropagator implements ReleasePropagator {
    public static callsToConstructor: (ReleasePropagatorOptions | undefined)[] =
        []
    public static numCallsToRun = 0

    public constructor(options?: ReleasePropagatorOptions) {
        FakeReleasePropagator.callsToConstructor.push(options)
    }

    public async run() {
        FakeReleasePropagator.numCallsToRun++
    }

    public static resetTestDouble() {
        FakeReleasePropagator.callsToConstructor = []
        FakeReleasePropagator.numCallsToRun = 0
    }
}
