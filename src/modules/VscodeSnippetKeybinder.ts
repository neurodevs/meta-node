import { readFile, writeFile } from 'fs/promises'

export default class VscodeSnippetKeybinder implements SnippetKeybinder {
    public static Class?: SnippetKeybinderConstructor
    public static readFile = readFile
    public static writeFile = writeFile

    private name: string
    private description: string
    private lines: string[]

    protected constructor(options: SnippetKeybinderOptions) {
        const { name, description, lines } = options

        this.name = name
        this.description = description
        this.lines = lines
    }

    public static Create(options: SnippetKeybinderOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        const raw = await this.readFile(this.snippetsPath, 'utf-8')
        const snippets = JSON.parse(raw)

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

    private toCommandId(name: string) {
        return name
            .trim()
            .toLowerCase()
            .replace(/[-_\s]+/g, '.')
            .replace(/[^a-z0-9.]/g, '')
            .replace(/\.+/g, '.')
            .replace(/^\.+|\.+$/g, '')
    }

    private readonly vscodeDir = '~/Library/Application Support/Code/User'
    private readonly snippetsDir = `${this.vscodeDir}/snippets`
    private readonly snippetsPath = `${this.snippetsDir}/custom.code-snippets`

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
