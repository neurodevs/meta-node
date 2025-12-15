import { Autocommit } from '../../impl/GitAutocommit.js'

export default class FakeAutocommit implements Autocommit {
    public static callsToConstructor: {
        commitMessage?: string
        cwd?: string
    }[] = []

    public static numCallsToRun = 0

    public constructor(commitMessage?: string, cwd?: string) {
        FakeAutocommit.callsToConstructor.push({
            commitMessage,
            cwd,
        })
    }

    public async run() {
        FakeAutocommit.numCallsToRun++
    }

    public static resetTestDouble() {
        FakeAutocommit.callsToConstructor = []
        FakeAutocommit.numCallsToRun = 0
    }
}
