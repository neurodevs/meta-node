import TypescriptClassSnippetSuite from '../impl/TypescriptClassSnippetSuite.js'

async function main() {
    console.log('Installing TypeScript Class Snippet Suite...')

    const instance = TypescriptClassSnippetSuite.Create()
    await instance.install()

    console.log('Installation complete!')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
