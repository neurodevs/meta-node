import { exec as execSync } from 'child_process'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { promisify } from 'util'
import { pathExists } from 'fs-extra'
import { parse } from 'jsonc-parser'

import GitAutocommit from './GitAutocommit.js'

export default class NpmAutopackage implements Autopackage {
    public static Class?: AutopackageConstructor
    public static exec = promisify(execSync)
    public static fetch = fetch
    public static mkdir = mkdir
    public static pathExists = pathExists
    public static readFile = readFile
    public static writeFile = writeFile

    private description: string
    private gitNamespace: string
    private npmNamespace?: string
    private keywords?: string[]
    private license?: string
    private author?: string

    private originalPackageJson!: Record<string, unknown>
    private originalGitignoreFile!: string
    private metaNodeVersion!: string

    private originalTasksJson!: {
        tasks: unknown[]
        inputs: unknown[]
        [key: string]: unknown
    }

    private shouldOpenVscode = false

    private readonly installDir: string
    private readonly packageName: string
    private readonly packageDir: string
    private readonly packageJsonPath: string
    private readonly gitignorePath: string
    private readonly tasksJsonPath: string
    private readonly settingsJsonPath: string
    private readonly testDirPath: string
    private readonly abstractTestPath: string

    private readonly abstractPackageTestFile = `import AbstractModuleTest from '@neurodevs/node-tdd'

export default abstract class AbstractPackageTest extends AbstractModuleTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }
}
`

    protected constructor(options: AutopackageOptions) {
        const {
            installDir,
            name,
            description,
            gitNamespace,
            npmNamespace,
            license,
            author,
            keywords,
        } = options

        this.installDir = installDir
        this.packageName = name
        this.description = description
        this.gitNamespace = gitNamespace
        this.npmNamespace = npmNamespace
        this.keywords = keywords
        this.license = license
        this.author = author

        this.packageDir = path.join(this.installDir, this.packageName)
        this.packageJsonPath = path.join(this.packageDir, 'package.json')
        this.gitignorePath = path.join(this.packageDir, '.gitignore')
        this.tasksJsonPath = path.join(this.packageDir, '.vscode/tasks.json')

        this.settingsJsonPath = path.join(
            this.packageDir,
            '.vscode/settings.json'
        )

        this.testDirPath = path.join(this.packageDir, 'src', '__tests__')

        this.abstractTestPath = path.join(
            this.testDirPath,
            'AbstractPackageTest.ts'
        )
    }

    public static Create(options: AutopackageOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        this.throwIfGithubTokenNotInEnv()

        await this.createRepoInGithubOrg()
        await this.cloneGitRepo()
        await this.resetMainToOrigin()
        await this.setCurrentMetaNodeVersion()
        await this.spruceCreateModule()
        await this.updatePackageJson()
        await this.updateGitignore()
        await this.setupVscode()
        await this.updateVscodeTasks()
        await this.installDefaultDevDependencies()
        await this.installAbstractPackageTest()
        await this.openVscode()
    }

    private throwIfGithubTokenNotInEnv() {
        if (!this.githubToken) {
            throw new Error('\n\nPlease set process.env.GITHUB_TOKEN!\n')
        }
    }

    private get githubToken() {
        return process.env.GITHUB_TOKEN
    }

    private async createRepoInGithubOrg() {
        const repoExists = await this.checkIfRepoExists()

        if (!repoExists) {
            console.log('Creating repository in GitHub organization...')
            await this.submitCreateRepoRequest()
        }
    }

    private async checkIfRepoExists() {
        const response = await this.fetch(
            `https://api.github.com/repos/${this.gitNamespace}/${this.packageName}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `token ${this.githubToken}`,
                    Accept: 'application/vnd.github+json',
                },
            }
        )
        return response.status === 200
    }

    private async submitCreateRepoRequest() {
        await this.fetch(
            `https://api.github.com/orgs/${this.gitNamespace}/repos`,
            {
                method: 'POST',
                headers: {
                    Authorization: `token ${this.githubToken}`,
                    Accept: 'application/vnd.github+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: this.packageName,
                    private: false,
                    description: this.description,
                    auto_init: true,
                    gitignore_template: 'Node',
                    license_template: 'mit',
                }),
            }
        )
    }

    private async cloneGitRepo() {
        const packageDirExists = await this.checkIfPackageDirExists()

        if (!packageDirExists) {
            console.log('Cloning git repository...')

            await this.exec(`git clone ${this.gitUrl}`, {
                cwd: this.installDir,
            })
            this.shouldOpenVscode = true
        }
    }

    private async checkIfPackageDirExists() {
        return this.pathExists(this.packageDir)
    }

    private get gitUrl() {
        return `https://github.com/${this.gitNamespace}/${this.packageName}.git`
    }

    private async resetMainToOrigin() {
        await this.exec('git fetch origin', { cwd: this.packageDir })

        await this.exec('git reset --hard origin/main', {
            cwd: this.packageDir,
        })
    }

    private async setCurrentMetaNodeVersion() {
        const globalRoot = await this.exec('yarn global dir')

        const pkgPath = path.join(
            globalRoot.stdout.trim(),
            'node_modules',
            '@neurodevs',
            'meta-node',
            'package.json'
        )

        const raw = await this.readFile(pkgPath, { encoding: 'utf-8' })
        const pkg = JSON.parse(raw)

        this.metaNodeVersion = pkg.version
    }

    private async spruceCreateModule() {
        const packageJsonExists = await this.checkIfPackageJsonExists()

        if (!packageJsonExists) {
            console.log('Running spruce create.module...')

            await this.execSpruceCreateModule()
            await this.commitCreatePackage()
        }
    }

    private async checkIfPackageJsonExists() {
        return this.pathExists(this.packageJsonPath)
    }

    private async execSpruceCreateModule() {
        await this.exec(
            `spruce create.module --name "${this.packageName}" --destination "." --description "${this.description}"`,
            { cwd: this.packageDir }
        )
    }

    private async commitCreatePackage() {
        await this.GitAutocommit(
            `patch: create package (@neurodevs/meta-node: ${this.metaNodeVersion})`
        )
    }

    private async updatePackageJson() {
        this.originalPackageJson = await this.loadPackageJsonFile()

        if (!this.isPackageUpToDate) {
            console.log('Updating package.json...')

            await this.updatePackageJsonFile()
            await this.commitUpdatePackageJson()
        }
    }

    private async loadPackageJsonFile() {
        const raw = await this.readFile(this.packageJsonPath, {
            encoding: 'utf-8',
        })
        return JSON.parse(raw)
    }

    private get isPackageUpToDate() {
        return (
            JSON.stringify(this.originalPackageJson) ==
            JSON.stringify(this.updatedPackageJson)
        )
    }

    private async updatePackageJsonFile() {
        const ordered = this.orderJsonKeys(this.updatedPackageJson, [
            'name',
            'version',
            'description',
            'keywords',
            'license',
            'author',
            'homepage',
            'repository',
            'bugs',
            'main',
            'bin',
            'files',
            'scripts',
            'dependencies',
            'devDependencies',
            'jest',
            'skill',
        ])

        await this.writeFile(
            this.packageJsonPath,
            JSON.stringify(ordered, null, 2) + '\n',
            { encoding: 'utf-8' }
        )
    }

    private get updatedPackageJson() {
        return {
            ...this.originalPackageJson,
            name: this.scopedPackageName,
            description: this.description,
            keywords: this.keywords ?? [],
            license: this.license,
            author: this.author,
            main: 'build/index.js',
            homepage: `https://github.com/${this.gitNamespace}/${this.packageName}`,
            repository: {
                type: 'git',
                url: `git+https://github.com/${this.gitNamespace}/${this.packageName}.git`,
            },
            bugs: {
                url: `https://github.com/${this.gitNamespace}/${this.packageName}/issues`,
            },
            dependencies: this.originalPackageJson.dependencies ?? {},
        }
    }

    private get scopedPackageName() {
        return this.npmNamespace
            ? `@${this.npmNamespace}/${this.packageName}`
            : this.packageName
    }

    private orderJsonKeys(json: Record<string, unknown>, keyOrder: string[]) {
        const ordered: Record<string, any> = {}

        for (const key of keyOrder) {
            if (key in json) {
                ordered[key] = json[key]
            }
        }

        const remainingKeys = Object.keys(json)
            .filter((k) => !keyOrder.includes(k))
            .sort()

        for (const key of remainingKeys) {
            ordered[key] = json[key]
        }

        return ordered
    }

    private async commitUpdatePackageJson() {
        await this.GitAutocommit(
            `patch: update package.json (@neurodevs/meta-node: ${this.metaNodeVersion})`
        )
    }

    private async updateGitignore() {
        this.originalGitignoreFile = await this.loadGitignoreFile()

        if (!this.isGitignoreUpdated) {
            console.log('Updating .gitignore...')

            await this.updateGitignoreFile()
            await this.commitUpdateGitignore()
        }
    }

    private async loadGitignoreFile() {
        return await this.readFile(this.gitignorePath, {
            encoding: 'utf-8',
        })
    }

    private get isGitignoreUpdated() {
        const lines = this.originalGitignoreFile
            .split(/\r?\n/)
            .map((line) => line.trim())

        return lines.includes('build/')
    }

    private async updateGitignoreFile() {
        await this.writeFile(this.gitignorePath, '\nbuild/\n', {
            encoding: 'utf-8',
            flag: 'a',
        })
    }

    private async commitUpdateGitignore() {
        await this.GitAutocommit(
            `patch: add build dir to gitignore (@neurodevs/meta-node: ${this.metaNodeVersion})`
        )
    }

    private async setupVscode() {
        const vscodeSettingsExist = await this.checkIfVscodeSettingsExist()

        if (!vscodeSettingsExist) {
            console.log('Setting up VSCode...')

            await this.spruceSetupVscode()
            await this.commitSetupVscode()
        }
    }

    private async checkIfVscodeSettingsExist() {
        return this.pathExists(this.settingsJsonPath)
    }

    private async spruceSetupVscode() {
        await this.exec('spruce setup.vscode --all true', {
            cwd: this.packageDir,
        })
    }

    private async commitSetupVscode() {
        await this.GitAutocommit(
            `patch: setup vscode (@neurodevs/meta-node: ${this.metaNodeVersion})`
        )
    }

    private async updateVscodeTasks() {
        this.originalTasksJson = await this.loadTasksJsonFile()

        if (!this.isTasksJsonUpdated) {
            console.log('Updating vscode tasks...')
            await this.updateTasksJsonFile()
            await this.commitUpdateVscodeTasks()
        }
    }

    private async updateTasksJsonFile() {
        await this.writeFile(this.tasksJsonPath, this.updatedTasksJsonFile, {
            encoding: 'utf-8',
        })
    }

    private get isTasksJsonUpdated() {
        return this.isTaskUpdated && this.isInputUpdated
    }

    private get isTaskUpdated() {
        return this.originalTasksJson.tasks.some(
            (task) => JSON.stringify(task) === JSON.stringify(this.requiredTask)
        )
    }

    private get isInputUpdated() {
        return this.originalTasksJson.inputs.some(
            (input) =>
                JSON.stringify(input) === JSON.stringify(this.requiredInput)
        )
    }

    private async loadTasksJsonFile() {
        const raw = await this.readFile(this.tasksJsonPath, {
            encoding: 'utf-8',
        })
        return parse(raw)
    }

    private get updatedTasksJsonFile() {
        return JSON.stringify(
            {
                ...this.originalTasksJson,
                tasks: [...this.originalTasksJson.tasks, this.requiredTask],
                inputs: [...this.originalTasksJson.inputs, this.requiredInput],
            },
            null,
            4
        )
    }

    private get requiredTask() {
        return {
            label: 'ndx',
            type: 'shell',
            command: 'ndx ${input:ndxCommand}',
            problemMatcher: [],
            presentation: {
                reveal: 'always',
                focus: true,
                panel: 'new',
                clear: false,
            },
        }
    }

    private get requiredInput() {
        return {
            id: 'ndxCommand',
            description: 'ndx command',
            default: 'create.module',
            type: 'promptString',
        }
    }

    private async commitUpdateVscodeTasks() {
        await this.GitAutocommit(
            `patch: update vscode tasks.json (@neurodevs/meta-node: ${this.metaNodeVersion})`
        )
    }

    private async installDefaultDevDependencies() {
        const generateIdVersion = await this.getLatestVersion(
            '@neurodevs/generate-id'
        )

        const nodeTddVersion = await this.getLatestVersion(
            '@neurodevs/node-tdd'
        )

        if (
            this.currentGenerateIdVersion != generateIdVersion ||
            this.currentNodeTddVersion != nodeTddVersion
        ) {
            console.log('Installing default devDependencies...')

            await this.exec(
                'yarn add -D @neurodevs/generate-id@latest @neurodevs/node-tdd@latest',
                { cwd: this.packageDir }
            )
            await this.commitInstallDevDependencies()
        }
    }

    private async getLatestVersion(scopedPackageName: string) {
        const { stdout } = await this.exec(
            `yarn info ${scopedPackageName} version --silent`,
            { cwd: this.packageDir }
        )
        return stdout.trim()
    }

    private get currentGenerateIdVersion() {
        return (
            (this.originalPackageJson.devDependencies as any)[
                '@neurodevs/generate-id'
            ] || ''
        ).replace('^', '')
    }

    private get currentNodeTddVersion() {
        return (
            (this.originalPackageJson.devDependencies as any)[
                '@neurodevs/node-tdd'
            ] || ''
        ).replace('^', '')
    }

    private async commitInstallDevDependencies() {
        await this.GitAutocommit(
            `patch: install default devDependencies (@neurodevs/meta-node: ${this.metaNodeVersion})`
        )
    }

    private async installAbstractPackageTest() {
        const fileExists = await this.checkIfAbstractPackageTestExists()

        if (!fileExists) {
            console.log(`Installing ${this.abstractTestPath}...`)

            await this.mkdir(this.testDirPath, { recursive: true })

            await this.writeFile(
                this.abstractTestPath,
                this.abstractPackageTestFile,
                {
                    encoding: 'utf-8',
                }
            )

            await this.commitInstallAbstractPackageTest()
        }
    }

    private async checkIfAbstractPackageTestExists() {
        const doesTsExist = await this.pathExists(this.abstractTestPath)
        const doesTsxExist = await this.pathExists(`${this.abstractTestPath}x`)

        return doesTsExist || doesTsxExist
    }

    private async commitInstallAbstractPackageTest() {
        await this.GitAutocommit(
            `patch: install AbstractPackageTest (@neurodevs/meta-node: ${this.metaNodeVersion})`
        )
    }

    private async openVscode() {
        if (this.shouldOpenVscode) {
            await this.exec('code .', { cwd: this.packageDir })
        }
    }

    private get exec() {
        return NpmAutopackage.exec
    }

    private get fetch() {
        return NpmAutopackage.fetch
    }

    private get mkdir() {
        return NpmAutopackage.mkdir
    }

    private get pathExists() {
        return NpmAutopackage.pathExists
    }

    private get readFile() {
        return NpmAutopackage.readFile
    }

    private get writeFile() {
        return NpmAutopackage.writeFile
    }

    private GitAutocommit(commitMessage: string) {
        return GitAutocommit.Create(commitMessage, this.packageDir)
    }
}

export interface Autopackage {
    run(): Promise<void>
}

export interface AutopackageOptions {
    installDir: string
    name: string
    description: string
    gitNamespace: string
    npmNamespace?: string
    keywords?: string[]
    license?: string
    author?: string
}

export type AutopackageConstructor = new (
    options: AutopackageOptions
) => Autopackage
