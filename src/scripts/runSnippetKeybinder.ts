import VscodeSnippetKeybinder from '../impl/VscodeSnippetKeybinder'

async function main() {
    console.log('Running VscodeSnippetKeybinder...')

    const instance = VscodeSnippetKeybinder.Create({
        name: 'Test the thingy',
        description: 'Test the thingy! Do it!',
        lines: ['@test()', 'protected static async exampleTest() {}'],
        keybinding: 'f5',
    })

    await instance.run()
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
