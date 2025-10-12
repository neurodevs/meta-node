import ImplAutomodule from '../modules/ImplAutomodule'

async function main() {
    console.log('\nRunning automodule...')

    const instance = ImplAutomodule.Create({
        testSaveDir:
            '/Users/ericthecurious/dev/meta-node/src/__tests__/modules',
        moduleSaveDir: '/Users/ericthecurious/dev/meta-node/src/modules',
        interfaceName: 'Autocomponent',
        implName: 'ReactAutocomponent',
    })

    await instance.run()

    console.log('Finished running automodule!\n')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
