import { Autopackage, AutopackageOptions } from '../../modules/NpmAutopackage'

export default class FakeAutopackage implements Autopackage {
    public static callsToConstructor: AutopackageOptions[] = []
    public static numCallsToCreatePackage = 0

    public constructor(options: AutopackageOptions) {
        FakeAutopackage.callsToConstructor.push(options)
    }

    public async createPackage() {
        FakeAutopackage.numCallsToCreatePackage++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToCreatePackage = 0
    }
}
