import { execSync } from 'child_process'
import fs from 'fs'

export default class NpmAutopackage implements Autopackage {
    public static Class?: AutopackageConstructor
    public static chdir = process.chdir
    public static execSync = execSync
    public static existsSync = fs.existsSync
    public static fetch = globalThis.fetch
    public static readFileSync = fs.readFileSync
    public static writeFileSync = fs.writeFileSync

    private packageName: string
    private packageDescription: string
    private gitNamespace: string
    private installDir: string
    private keywords?: string[]
    private license?: string
    private author?: string

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
        this.packageDescription = description
        this.gitNamespace = gitNamespace
        this.installDir = installDir
        this.keywords = keywords
        this.license = license
        this.author = author
    }

    public static async Create(options: AutopackageOptions) {
        const instance = new (this.Class ?? this)(options)
        await instance.createPackage()

        return instance
    }

    public async createPackage() {
        this.throwIfGithubTokenNotInEnv()

        await this.createRepoInGithubOrg()

        this.chdirToInstallDir()
        this.cloneGitRepoIfNotExists()
        this.chdirToPackageDir()
        this.spruceCreateModuleIfNotExists()
        this.updatePackageJson()
        this.setupVscodeIfNotExists()
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
                    description: this.packageDescription,
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

    private cloneGitRepoIfNotExists() {
        if (!this.packageDirExists) {
            this.exec(`git clone ${this.gitUrl}`)
        }
    }

    private get packageDirExists() {
        return this.existsSync(this.packageDir)
    }

    private get packageDir() {
        return `${this.installDir}/${this.packageName}`
    }

    private get gitUrl() {
        return `https://github.com/${this.gitNamespace}/${this.packageName}.git`
    }

    private chdirToPackageDir() {
        this.chdir(this.packageDir)
    }

    private spruceCreateModuleIfNotExists() {
        if (!this.packageJsonExists) {
            this.spruceCreateModule()
            this.commitCreatePackage()
        }
    }

    private get packageJsonExists() {
        return this.existsSync(this.packageJsonPath)
    }

    private get packageJsonPath() {
        return `${this.packageDir}/package.json`
    }

    private spruceCreateModule() {
        this.exec(
            `spruce create.module --name "${this.packageName}" --destination "${this.installDir}/${this.packageName}" --description "${this.packageDescription}"`
        )
    }

    private commitCreatePackage() {
        this.gitAddAll()
        this.gitCommitCreatePackage()
        this.gitPush()
    }

    private gitAddAll() {
        this.exec('git add .')
    }

    private gitCommitCreatePackage() {
        this.exec('git commit -m "patch: create package"')
    }

    private gitPush() {
        this.exec('git push')
    }

    private updatePackageJson() {
        const raw = this.readFileSync(this.packageJsonPath, {
            encoding: 'utf-8',
        })

        const original = JSON.parse(raw)
        const updated = { ...original, ...this.updatedJsonFile }
        const ordered = this.orderJsonKeys(updated, [
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
            'scripts',
            'dependencies',
            'devDependencies',
            'jest',
            'skill',
        ])

        this.writeFileSync(
            this.packageJsonPath,
            JSON.stringify(ordered, null, 2) + '\n',
            { encoding: 'utf-8' }
        )
    }

    private get updatedJsonFile() {
        return {
            name: `@${this.scopedPackage}`,
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
            dependencies: {},
        }
    }

    private get scopedPackage() {
        return `${this.gitNamespace}/${this.packageName}`
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

    private setupVscodeIfNotExists() {
        if (!this.vscodeSettingsExists) {
            this.spruceSetupVscode()
            this.commitSetupVscode()
        }
    }

    private get vscodeSettingsExists() {
        return this.existsSync(`${this.packageDir}/.vscode/settings.json`)
    }

    private spruceSetupVscode() {
        this.exec('spruce setup.vscode --all true')
    }

    private commitSetupVscode() {
        this.gitAddAll()
        this.gitCommitSetup()
        this.gitPush()
    }

    private gitCommitSetup() {
        this.exec('git commit -m "patch: setup vscode"')
    }

    private get chdir() {
        return NpmAutopackage.chdir
    }

    private get exec() {
        return NpmAutopackage.execSync
    }

    private get existsSync() {
        return NpmAutopackage.existsSync
    }

    private get fetch() {
        return NpmAutopackage.fetch
    }

    private get readFileSync() {
        return NpmAutopackage.readFileSync
    }

    private get writeFileSync() {
        return NpmAutopackage.writeFileSync
    }
}

export interface Autopackage {
    createPackage(): Promise<void>
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

export type AutopackageConstructor = new () => Autopackage
