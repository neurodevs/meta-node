import { Automodule, BaseAutomoduleOptions } from '../types'

export default class UiAutomodule implements Automodule {
    public static Class?: UiAutomoduleConstructor

    protected constructor(_options: UiAutomoduleOptions) {}

    public static Create(options: UiAutomoduleOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {}
}

export type UiAutomoduleConstructor = new (
    options: UiAutomoduleOptions
) => Automodule

export interface UiAutomoduleOptions extends BaseAutomoduleOptions {}
