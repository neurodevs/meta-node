import { Autocommit } from '../../impl/GitAutocommit.js'

export default class FakeAutocommit implements Autocommit {
    public static callsToConstructor: (string | undefined)[] = []
    public static numCallsToRun = 0

    public constructor(commitMessage?: string) {
        FakeAutocommit.callsToConstructor.push(commitMessage)
    }

    public async run() {
        FakeAutocommit.numCallsToRun++
    }

    public static resetTestDouble() {
        FakeAutocommit.callsToConstructor = []
        FakeAutocommit.numCallsToRun = 0
    }
}
