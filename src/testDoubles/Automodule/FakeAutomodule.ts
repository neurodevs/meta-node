import { ImplAutomoduleOptions } from '../../modules/ImplAutomodule'
import { UiAutomoduleOptions } from '../../modules/UiAutomodule'
import { Automodule } from '../../types'

export default class FakeImplAutomodule implements Automodule {
    public static callsToConstructor: FakeAutomoduleOptions[] = []
    public static numCallsToRun = 0

    public constructor(options: FakeAutomoduleOptions) {
        FakeImplAutomodule.callsToConstructor.push(options)
    }

    public async run() {
        FakeImplAutomodule.numCallsToRun++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToRun = 0
    }
}

export type FakeAutomoduleOptions = ImplAutomoduleOptions | UiAutomoduleOptions
