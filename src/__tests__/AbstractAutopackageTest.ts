import path from 'path'

import AbstractPackageTest from './AbstractPackageTest.js'
import { TsConfig } from '../impl/NpmAutopackage.js'

export default class AbstractAutopackageTest extends AbstractPackageTest {
    protected static readonly installDir = this.generateId()
    protected static readonly description = this.generateId()
    protected static readonly gitNamespace = this.generateId()
    protected static readonly npmNamespace = this.generateId()
    protected static readonly scopedPackageName = `@${this.npmNamespace}/${this.packageName}`
    protected static readonly keywords = [this.generateId(), this.generateId()]
    protected static readonly license = this.generateId()
    protected static readonly author = this.generateId()
    protected static readonly githubToken = this.generateId()
    protected static readonly randomId = this.generateId()

    protected static readonly customLib = this.generateId()
    protected static readonly customType = this.generateId()
    protected static readonly customInclude = this.generateId()
    protected static readonly customTsconfigOption = this.generateId()
    protected static readonly customJestOption = this.generateId()
    protected static readonly customScript = this.generateId()

    protected static readonly dependencies = {
        [this.generateId()]: this.generateId(),
        [this.generateId()]: this.generateId(),
    }

    protected static readonly autopackageOptions = {
        installDir: this.installDir,
        name: this.packageName,
        description: this.description,
        gitNamespace: this.gitNamespace,
        npmNamespace: this.npmNamespace,
        keywords: this.keywords,
        license: this.license,
        author: this.author,
    }

    protected static readonly packageDir = path.join(
        this.installDir,
        this.packageName
    )

    protected static readonly packageJsonPath = path.join(
        this.packageDir,
        'package.json'
    )

    protected static readonly packageJsonTemplate = {
        name: this.scopedPackageName,
        description: this.description,
        type: 'module',
        keywords: this.keywords,
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
        scripts: {
            'build.ci': `yarn run build.tsc && yarn run lint`,
            'build.dev': `yarn run build.tsc --sourceMap ; yarn run fix.lint ; prettier --write . --log-level warn`,
            'build.copy-files': `mkdir -p build && rsync -avzq --exclude='*.ts' ./src/ ./build/`,
            'build.tsc': `yarn run build.copy-files && tsc`,
            clean: `yarn run clean.build`,
            'clean.all': `yarn run clean.dependencies && yarn run clean.build`,
            'clean.build': `rm -rf build/`,
            'clean.dependencies': `rm -rf node_modules/ package-lock.json yarn.lock`,
            'fix.lint': `eslint --fix --cache '**/*.ts'`,
            lint: `eslint --cache '**/*.ts'`,
            rebuild: `yarn run clean.all && yarn install && yarn run build.dev`,
            'update.dependencies': `yarn run clean.dependencies && yarn`,
            test: 'NODE_OPTIONS=--experimental-vm-modules jest',
            'watch.build.dev': `tsc-watch --sourceMap --onCompilationComplete 'yarn run build.copy-files'`,
        },
        dependencies: {},
        devDependencies: {},
        jest: {
            testEnvironment: 'node',
            testRunner: 'jest-circus/runner',
            testMatch: ['<rootDir>/build/__tests__/**/*.test.js?(x)'],
            testTimeout: 5000,
            maxWorkers: 4,
        },
    }

    protected static readonly packageJsonCustom = {
        name: this.packageName,
        description: 'Old description',
        scripts: {
            customScript: this.customScript,
        },
        dependencies: this.dependencies,
        devDependencies: {
            '@neurodevs/generate-id': '^1.0.0',
            '@neurodevs/node-tdd': '^1.0.0',
            '@neurodevs/eslint-config-ndx': '^1.0.0',
            '@neurodevs/prettier-config-ndx': '^1.0.0',
        },
        peerDependencies: {
            customPeerDependency: '^1.0.0',
        },
        jest: {
            ['customOption']: this.customJestOption,
        },
    }

    protected static readonly updatedPackageJson = this.orderJsonKeys(
        {
            ...this.packageJsonTemplate,
            ...this.packageJsonCustom,
            scripts: {
                ...this.packageJsonTemplate.scripts,
                ...this.packageJsonCustom.scripts,
            },
            dependencies: {
                ...this.packageJsonTemplate.dependencies,
                ...this.packageJsonCustom.dependencies,
            },
            devDependencies: {
                ...this.packageJsonTemplate.devDependencies,
                ...this.packageJsonCustom.devDependencies,
            },
            peerDependencies: this.packageJsonCustom.peerDependencies,
            jest: {
                ...this.packageJsonTemplate.jest,
                ...this.packageJsonCustom.jest,
            },
        },
        [
            'name',
            'version',
            'description',
            'type',
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
            'peerDependencies',
            'jest',
        ]
    )

    protected static readonly gitignorePath = path.join(
        this.packageDir,
        '.gitignore'
    )

    protected static readonly gitignoreCustom = this.generateId()
    protected static readonly gitignoreTemplate = '\nbuild/\n'
    protected static readonly updatedGitignore = `${this.gitignoreCustom}${this.gitignoreTemplate}`

    protected static readonly tsconfigPath = path.join(
        this.packageDir,
        'tsconfig.json'
    )

    protected static readonly tsconfigCustom: TsConfig = {
        compilerOptions: {
            lib: [this.customLib],
            types: [this.customType],
            customOption: this.customTsconfigOption,
        },
        include: [this.customInclude],
        customOption: this.customTsconfigOption,
    }

    protected static readonly tsconfigTemplate: TsConfig = {
        compilerOptions: {
            module: 'nodenext',
            target: 'esnext',
            lib: ['esnext'],
            types: ['node'],
            rootDir: 'src',
            outDir: 'build',
            sourceMap: false,
            strict: true,
            noImplicitAny: true,
            noImplicitReturns: true,
            noUnusedLocals: true,
            forceConsistentCasingInFileNames: true,
            declaration: true,
            skipLibCheck: true,
            esModuleInterop: true,
            moduleDetection: 'force',
            allowJs: true,
            resolveJsonModule: true,
            experimentalDecorators: true,
        },
        include: ['./src/*.ts', './src/**/*.ts'],
    }

    protected static readonly updatedTsconfig: TsConfig = {
        ...this.tsconfigTemplate,
        ...this.tsconfigCustom,
        compilerOptions: {
            ...this.tsconfigTemplate.compilerOptions,
            ...this.tsconfigCustom.compilerOptions,
            lib: [
                ...(this.tsconfigTemplate.compilerOptions?.lib || []),
                ...(this.tsconfigCustom.compilerOptions?.lib || []),
            ],
            types: [
                ...(this.tsconfigTemplate.compilerOptions?.types || []),
                ...(this.tsconfigCustom.compilerOptions?.types || []),
            ],
        },
        include: [
            ...(this.tsconfigTemplate.include || []),
            ...(this.tsconfigCustom.include || []),
        ],
    }

    protected static readonly tasksJsonPath = path.join(
        this.packageDir,
        '.vscode',
        'tasks.json'
    )

    protected static tasksJsonCustom = {
        [this.randomId]: this.randomId,
        tasks: [
            {
                [this.randomId]: this.randomId,
            },
        ],
        inputs: [
            {
                [this.randomId]: this.randomId,
            },
        ],
    }

    protected static readonly tasksJsonTemplate = {
        version: '1.0.0',
        tasks: [
            {
                type: 'npm',
                script: 'watch.build.dev',
                group: 'build',
                label: 'watch.build.dev & problem.watcher',
                isBackground: true,
                runOptions: {
                    runOn: 'folderOpen',
                },
                promptOnClose: false,
                presentation: {
                    focus: false,
                    reveal: 'never',
                },
                problemMatcher: {
                    base: '$tsc-watch',
                    applyTo: 'allDocuments',
                },
            },
            {
                label: 'test.file',
                type: 'shell',
                command:
                    'node node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js --pattern "${fileBasenameNoExtension}" --watchMode standard --inspect 5200',
                promptOnClose: false,
                group: {
                    kind: 'test',
                    isDefault: true,
                },
                presentation: {
                    reveal: 'always',
                    panel: 'dedicated',
                },
                problemMatcher: [],
            },
            {
                label: 'test.reporter',
                type: 'shell',
                command:
                    'node node_modules/@neurodevs/node-tdd/build/workspace/testRunner.cli.js --watchMode standard',
                promptOnClose: false,
                group: 'test',
                runOptions: {
                    runOn: 'folderOpen',
                },
                presentation: {
                    panel: 'shared',
                    focus: true,
                    reveal: 'always',
                },
                problemMatcher: [],
            },
            {
                label: 'shell',
                type: 'shell',
                command: '${input:command} ${input:optionsCommand}',
                problemMatcher: [],
                presentation: {
                    reveal: 'always',
                    focus: true,
                    panel: 'new',
                    clear: false,
                },
            },
            {
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
            },
        ],
        inputs: [
            {
                id: 'command',
                description: 'command',
                default: 'yarn',
                type: 'promptString',
            },
            {
                id: 'optionsCommand',
                description: 'optionsCommand',
                default: 'add',
                type: 'promptString',
            },
            {
                id: 'ndxCommand',
                description: 'ndx command',
                default: 'create.module',
                type: 'promptString',
            },
        ],
    }

    protected static readonly updatedTasksJson = JSON.stringify(
        {
            ...this.tasksJsonTemplate,
            ...this.tasksJsonCustom,
            tasks: [
                ...this.tasksJsonTemplate.tasks,
                ...this.tasksJsonCustom.tasks,
            ],
            inputs: [
                ...this.tasksJsonTemplate.inputs,
                ...this.tasksJsonCustom.inputs,
            ],
        },
        null,
        2
    )

    protected static readonly testsDir = path.join(
        this.packageDir,
        'src',
        '__tests__'
    )

    protected static readonly abstractTestPath = path.join(
        this.testsDir,
        'AbstractPackageTest.ts'
    )

    protected static readonly abstractTestFile = `import AbstractModuleTest from '@neurodevs/node-tdd'

export default abstract class AbstractPackageTest extends AbstractModuleTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }
}
`

    protected static readonly eslintConfigPath = path.join(
        this.packageDir,
        'eslint.config.js'
    )

    protected static readonly eslintConfigFile = `import eslintConfigNdx from '@neurodevs/eslint-config-ndx'

export default eslintConfigNdx
`

    protected static readonly prettierConfigPath = path.join(
        this.packageDir,
        'prettier.config.js'
    )

    protected static readonly prettierConfigFile = `import prettierConfigNdx from '@neurodevs/prettier-config-ndx'

export default prettierConfigNdx
`

    protected static readonly settingsJsonPath = path.join(
        this.packageDir,
        '.vscode',
        'settings.json'
    )

    protected static readonly settingsJsonFile = `{
  "debug.node.autoAttach": "on",
  "git.ignoreLimitWarning": true,
  "javascript.validate.enable": false,
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/build/**": true,
    "**/node_modules/**": true
  },
  "search.exclude": {
    "**/build/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  },
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.maxTokenizationLineLength": 20000000,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "eslint.enable": true,
  "eslint.useFlatConfig": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": ["./"],
  "debug.javascript.unmapMissingSources": true,
  "javascript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.validate.enable": true,
  "cSpell.ignorePaths": [
    "**/package-lock.json",
    "**/node_modules/**",
    "**/build/**",
    "**/vscode-extension/**",
    "**/.git/objects/**",
    ".vscode"
  ],
  "cSpell.words": ["arkit", "autogenerated", "scrollable", "serializable"]
}
`

    protected static readonly checkGenerateIdVersionCmd = `yarn info @neurodevs/generate-id version --silent`
    protected static readonly checkNodeTddVersionCmd = `yarn info @neurodevs/node-tdd version --silent`
    protected static readonly checkEslintConfigNdxVersionCmd = `yarn info @neurodevs/eslint-config-ndx version --silent`
    protected static readonly checkPrettierConfigNdxVersionCmd = `yarn info @neurodevs/prettier-config-ndx version --silent`

    protected static readonly yarnRemoveDevDepsCommand =
        'yarn remove @types/node concurrently eslint chokidar-cli ts-node'

    protected static readonly yarnInstallDevDepsCommand =
        'yarn add -D @neurodevs/generate-id @neurodevs/node-tdd @neurodevs/eslint-config-ndx @neurodevs/prettier-config-ndx prettier'

    protected static orderJsonKeys(
        json: Record<string, unknown>,
        keyOrder: string[]
    ) {
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
}
