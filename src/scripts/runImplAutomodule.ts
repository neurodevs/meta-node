import ImplAutomodule from '../modules/ImplAutomodule'
import expandHomeDir from './expandHomeDir'

async function main() {
    console.log('\nRunning automodule...')

    const instance = ImplAutomodule.Create({
        testSaveDir: expandHomeDir('~/dev/meta-node/src/__tests__/modules'),
        moduleSaveDir: expandHomeDir('~/dev/meta-node/src/modules'),
        fakeSaveDir: expandHomeDir('~/dev/meta-node/src/testDoubles/Interface'),
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
