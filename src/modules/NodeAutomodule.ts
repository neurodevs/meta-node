export default class NodeAutomodule implements Automodule {
    public static Class?: AutomoduleConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface Automodule {}

export type AutomoduleConstructor = new () => Automodule
