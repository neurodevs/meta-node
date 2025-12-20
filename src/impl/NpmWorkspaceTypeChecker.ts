export default class NpmWorkspaceTypeChecker implements WorkspaceTypeChecker {
    public static Class?: WorkspaceTypeCheckerConstructor

    protected constructor(_workspacePath: string) {}

    public static Create(workspacePath: string) {
        return new (this.Class ?? this)(workspacePath)
    }
}

export interface WorkspaceTypeChecker {}

export type WorkspaceTypeCheckerConstructor = new (
    workspacePath: string
) => WorkspaceTypeChecker
