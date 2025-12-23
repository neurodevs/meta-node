import NpmWorkspaceTypeChecker from '../impl/NpmWorkspaceTypeChecker.js'

const checker = NpmWorkspaceTypeChecker.Create('../')
await checker.run()
