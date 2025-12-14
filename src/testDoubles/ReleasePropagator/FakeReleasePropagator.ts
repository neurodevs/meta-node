import {
    ReleasePropagator,
    ReleasePropagatorOptions,
} from '../../impl/NpmReleasePropagator.js'

export default class FakeReleasePropagator implements ReleasePropagator {
    public static callsToConstructor: (ReleasePropagatorOptions | undefined)[] =
        []

    public constructor(options?: ReleasePropagatorOptions) {
        FakeReleasePropagator.callsToConstructor.push(options)
    }

    public static resetTestDouble() {
        FakeReleasePropagator.callsToConstructor = []
    }
}
