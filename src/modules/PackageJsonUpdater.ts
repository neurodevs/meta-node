export default class PackageJsonUpdater implements JsonUpdater {
    public static Class?: JsonUpdateConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface JsonUpdater {}

export type JsonUpdateConstructor = new () => JsonUpdater
