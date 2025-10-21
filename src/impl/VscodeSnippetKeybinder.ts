import { readFile, writeFile } from 'fs/promises'
import { parse } from 'jsonc-parser'
import expandHomeDir from '../functions/expandHomeDir'

export default class VscodeSnippetKeybinder implements SnippetKeybinder {
    public static Class?: SnippetKeybinderConstructor
    public static readFile = readFile
    public static writeFile = writeFile

    private name: string
    private description: string
    private lines: string[]
    private keybinding: string

    protected constructor(options: SnippetKeybinderOptions) {
        const { name, description, lines, keybinding } = options

        this.name = name
        this.description = description
        this.lines = lines
        this.keybinding = keybinding
    }

    public static Create(options: SnippetKeybinderOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        await this.updateGlobalSnippets()
        await this.updateGlobalKeybindings()
    }

    private async updateGlobalSnippets() {
        const raw = await this.readFile(this.snippetsPath, 'utf-8')
        const snippets = parse(raw)

        const updated = {
            ...snippets,
            [this.name]: {
                scope: 'javascript,typescript',
                prefix: this.toCommandId(this.name),
                body: this.lines,
                description: this.description,
            },
        }

        await this.writeFile(
            this.snippetsPath,
            JSON.stringify(updated, null, 4)
        )
    }

    private readonly vscodeDir = expandHomeDir(
        '~/Library/Application Support/Code/User'
    )

    private readonly snippetsPath = `${this.vscodeDir}/snippets/custom.code-snippets`

    private toCommandId(name: string) {
        return name
            .trim()
            .toLowerCase()
            .replace(/[-_\s]+/g, '.')
            .replace(/[^a-z0-9.]/g, '')
            .replace(/\.+/g, '.')
            .replace(/^\.+|\.+$/g, '')
    }

    private async updateGlobalKeybindings() {
        const raw = await this.readFile(this.keybindingsPath, 'utf-8')
        const keybindings = parse(raw)

        const updated = [
            ...keybindings,
            {
                key: this.keybinding,
                command: `editor.action.insertSnippet`,
                when: 'editorTextFocus',
                args: {
                    name: this.name,
                },
            },
        ]

        await this.writeFile(
            this.keybindingsPath,
            JSON.stringify(updated, null, 4)
        )
    }

    private readonly keybindingsPath = `${this.vscodeDir}/keybindings.json`

    private get readFile() {
        return VscodeSnippetKeybinder.readFile
    }

    private get writeFile() {
        return VscodeSnippetKeybinder.writeFile
    }
}

export interface SnippetKeybinder {
    run(): Promise<void>
}

export type SnippetKeybinderConstructor = new (
    options: SnippetKeybinderOptions
) => SnippetKeybinder

export interface SnippetKeybinderOptions {
    name: string
    description: string
    lines: string[]
    keybinding: string
}
