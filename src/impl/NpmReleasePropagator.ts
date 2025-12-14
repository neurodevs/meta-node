export default class NpmReleasePropagator implements ReleasePropagator {
    public static Class?: ReleasePropagatorConstructor

    protected constructor(_options: ReleasePropagatorOptions) {}

    public static Create(options: ReleasePropagatorOptions) {
        return new (this.Class ?? this)(options)
    }
}

export interface ReleasePropagator {}

export type ReleasePropagatorConstructor = new (
    options: ReleasePropagatorOptions
) => ReleasePropagator

export interface ReleasePropagatorOptions {
    packageName: string
    packageVersion: string
    repoPaths: string[]
}
