export default class PackageAutodocumenter implements Autodocumenter {
    public static Class?: AutodocumenterConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface Autodocumenter {}

export type AutodocumenterConstructor = new () => Autodocumenter
