import { Autodocumenter } from '../../impl/PackageAutodocumenter'

export default class FakeAutodocumenter implements Autodocumenter {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeAutodocumenter.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeAutodocumenter.numCallsToConstructor = 0
    }
}
