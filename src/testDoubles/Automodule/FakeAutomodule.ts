import { Automodule, AutomoduleOptions } from '../../modules/NodeAutomodule'

export default class FakeAutomodule implements Automodule {
    public static callsToConstructor: AutomoduleOptions[] = []
    public static numCallsToRun = 0

    public constructor(options: AutomoduleOptions) {
        FakeAutomodule.callsToConstructor.push(options)
    }

    public async run() {
        FakeAutomodule.numCallsToRun++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToRun = 0
    }
}
