import { pathExists } from 'fs-extra'
import { Automodule, BaseAutomoduleOptions } from '../types'
import AbstractAutomodule from './AbstractAutomodule'

export default class UiAutomodule
    extends AbstractAutomodule
    implements Automodule
{
    public static Class?: UiAutomoduleConstructor
    public static pathExists = pathExists

    protected constructor(options: UiAutomoduleOptions) {
        const { testSaveDir, moduleSaveDir, fakeSaveDir } = options

        super({
            testSaveDir,
            moduleSaveDir,
            fakeSaveDir,
            pathExists: UiAutomodule.pathExists,
        })
    }

    public static Create(options: UiAutomoduleOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        await this.throwIfDirectoriesDoNotExist()
    }
}

export type UiAutomoduleConstructor = new (
    options: UiAutomoduleOptions
) => Automodule

export interface UiAutomoduleOptions extends BaseAutomoduleOptions {}
