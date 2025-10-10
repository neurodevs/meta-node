import NodeAutomodule from '../modules/NodeAutomodule'

async function main() {
    console.log('\nRunning automodule...\n\n')

    const instance = NodeAutomodule.Create({
        testSaveDir:
            '/Users/ericthecurious/dev/meta-node/src/__tests__/modules',
        moduleSaveDir: '/Users/ericthecurious/dev/meta-node/src/modules',
        interfaceName: 'Autocomponent',
        implName: 'ReactAutocomponent',
    })

    await instance.run()

    console.log('\nFinished running automodule!\n\n')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
