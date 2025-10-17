import { exec as execSync } from 'child_process'
import { readFile, writeFile } from 'fs/promises'
import { chdir } from 'process'
import { promisify } from 'util'
import { pathExists } from 'fs-extra'
import { parse } from 'jsonc-parser'

export default class NpmAutopackage implements Autopackage {
    public static Class?: AutopackageConstructor
    public static chdir = chdir
    public static exec = promisify(execSync)
    public static fetch = fetch
    public static pathExists = pathExists
    public static readFile = readFile
    public static writeFile = writeFile

    private packageName: string
    private description: string
    private gitNamespace: string
    private installDir: string
    private keywords?: string[]
    private license?: string
    private author?: string

    private originalPackageJson!: Record<string, unknown>
    private originalGitignoreFile!: string

    private originalTasksJson!: {
        tasks: unknown[]
        inputs: unknown[]
        [key: string]: unknown
    }

    private shouldOpenVscode = false

    protected constructor(options: AutopackageOptions) {
        const {
            name,
            description,
            gitNamespace,
            installDir,
            license,
            author,
            keywords,
        } = options

        this.packageName = name
        this.description = description
        this.gitNamespace = gitNamespace
        this.installDir = installDir
        this.keywords = keywords
        this.license = license
        this.author = author
    }

    public static Create(options: AutopackageOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        this.throwIfGithubTokenNotInEnv()

        await this.createRepoInGithubOrg()

        this.chdirToInstallDir()
        await this.cloneGitRepo()

        this.chdirToPackageDir()
        await this.spruceCreateModule()
        await this.updatePackageJson()
        await this.updateGitignore()
        await this.setupVscode()
        await this.updateVscodeTasks()
        await this.installDefaultDevDependencies()
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

    private chdirToInstallDir() {
        this.chdir(this.installDir)
    }

    private async cloneGitRepo() {
        const packageDirExists = await this.checkIfPackageDirExists()

        if (!packageDirExists) {
            console.log('Cloning git repository...')
            await this.exec(`git clone ${this.gitUrl}`)
            this.shouldOpenVscode = true
        }
    }

    private async checkIfPackageDirExists() {
        return this.pathExists(this.packageDir)
    }

    private get packageDir() {
        return this.packageName
    }

    private get gitUrl() {
        return `https://github.com/${this.gitNamespace}/${this.packageName}.git`
    }

    private chdirToPackageDir() {
        this.chdir(this.packageDir)
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

    private readonly packageJsonPath = 'package.json'

    private async execSpruceCreateModule() {
        await this.exec(
            `spruce create.module --name "${this.packageName}" --destination "${this.packageName}" --description "${this.description}"`
        )
    }

    private async commitCreatePackage() {
        await this.gitAddAll()
        await this.gitCommitCreatePackage()
        await this.gitPush()
    }

    private async gitAddAll() {
        await this.exec('git add .')
    }

    private async gitCommitCreatePackage() {
        await this.exec('git commit -m "patch: create package"')
    }

    private async gitPush() {
        await this.exec('git push')
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
        return `@${this.gitNamespace}/${this.packageName}`
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
        await this.gitAddAll()
        await this.gitCommitUpdatePackage()
        await this.gitPush()
    }

    private async gitCommitUpdatePackage() {
        await this.exec('git commit -m "patch: update package.json"')
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

    private readonly gitignorePath = '.gitignore'

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
        await this.gitAddAll()
        await this.gitCommitUpdateGitignore()
        await this.gitPush()
    }

    private async gitCommitUpdateGitignore() {
        await this.exec('git commit -m "patch: add build dir to gitignore"')
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
        return this.pathExists(`.vscode/settings.json`)
    }

    private async spruceSetupVscode() {
        await this.exec('spruce setup.vscode --all true')
    }

    private async commitSetupVscode() {
        await this.gitAddAll()
        await this.gitCommitSetupVscode()
        await this.gitPush()
    }

    private async gitCommitSetupVscode() {
        await this.exec('git commit -m "patch: setup vscode"')
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

    private readonly tasksJsonPath = '.vscode/tasks.json'

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
        await this.gitAddAll()
        await this.gitCommitUpdateVscodeTasks()
        await this.gitPush()
    }

    private async gitCommitUpdateVscodeTasks() {
        await this.exec('git commit -m "patch: update vscode tasks.json"')
    }

    private async installDefaultDevDependencies() {
        const latestVersion = await this.getLatestGenerateIdVersion()

        if (this.currentGenerateIdVersion != latestVersion) {
            console.log('Installing default devDependencies...')
            await this.exec('yarn add -D @neurodevs/generate-id@latest')
            await this.commitInstallDevDependencies()
        }
    }

    private get currentGenerateIdVersion() {
        return (
            (this.originalPackageJson.devDependencies as any)[
                '@neurodevs/generate-id'
            ] || ''
        ).replace('^', '')
    }

    private async getLatestGenerateIdVersion() {
        const { stdout } = await this.exec(
            `yarn info @neurodevs/generate-id version --silent`
        )
        return stdout.trim()
    }

    private async commitInstallDevDependencies() {
        await this.gitAddAll()
        await this.gitCommitInstallDevDependencies()
        await this.gitPush()
    }

    private async gitCommitInstallDevDependencies() {
        await this.exec(
            'git commit -m "patch: install default devDependencies"'
        )
    }

    private async openVscode() {
        if (this.shouldOpenVscode) {
            await this.exec('code .')
        }
    }

    private get chdir() {
        return NpmAutopackage.chdir
    }

    private get exec() {
        return NpmAutopackage.exec
    }

    private get pathExists() {
        return NpmAutopackage.pathExists
    }

    private get fetch() {
        return NpmAutopackage.fetch
    }

    private get readFile() {
        return NpmAutopackage.readFile
    }

    private get writeFile() {
        return NpmAutopackage.writeFile
    }
}

export interface Autopackage {
    run(): Promise<void>
}

export interface AutopackageOptions {
    name: string
    description: string
    gitNamespace: string
    npmNamespace: string
    installDir: string
    keywords?: string[]
    license?: string
    author?: string
}

export type AutopackageConstructor = new (
    options: AutopackageOptions
) => Autopackage
