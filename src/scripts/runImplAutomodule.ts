import expandHomeDir from '../functions/expandHomeDir.js'
import ImplAutomodule from '../impl/ImplAutomodule.js'

async function main() {
    console.log('\nRunning automodule...')

    const instance = ImplAutomodule.Create({
        testSaveDir: expandHomeDir('~/dev/meta-node/src/__tests__/impl'),
        moduleSaveDir: expandHomeDir('~/dev/meta-node/src/impl'),
        fakeSaveDir: expandHomeDir('~/dev/meta-node/src/testDoubles'),
        interfaceName: 'Interface',
        implName: 'InterfaceImpl',
    })

    await instance.run()

    console.log('Finished running automodule!\n')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
