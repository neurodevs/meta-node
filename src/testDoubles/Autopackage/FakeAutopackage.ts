import { Autopackage, AutopackageOptions } from '../../impl/NpmAutopackage.js'

export default class FakeAutopackage implements Autopackage {
    public static callsToConstructor: AutopackageOptions[] = []
    public static numCallsToRun = 0

    public constructor(options: AutopackageOptions) {
        FakeAutopackage.callsToConstructor.push(options)
    }

    public async run() {
        FakeAutopackage.numCallsToRun++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToRun = 0
    }
}
