import ImplAutomodule from '../modules/ImplAutomodule'

async function main() {
    console.log('\nRunning automodule...')

    const instance = ImplAutomodule.Create({
        testSaveDir: '/Users/ericthecurious/dev/meta-node/src/__tests__',
        moduleSaveDir: '/Users/ericthecurious/dev/meta-node/src/modules',
        fakeSaveDir: '/Users/ericthecurious/dev/meta-node/src/testDoubles',
        interfaceName: 'Autodocumenter',
        implName: 'PackageAutodocumenter',
    })

    await instance.run()

    console.log('Finished running automodule!\n')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
