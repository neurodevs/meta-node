import UiAutomodule from '../impl/UiAutomodule'
import expandHomeDir from '../functions/expandHomeDir'

async function main() {
    console.log('\nRunning automodule...')

    const instance = UiAutomodule.Create({
        testSaveDir: expandHomeDir('~/dev/meta-node/src/__tests__/modules'),
        moduleSaveDir: expandHomeDir('~/dev/meta-node/src/modules'),
        fakeSaveDir: expandHomeDir('~/dev/meta-node/src/testDoubles/Component'),
        componentName: 'Component',
    })

    await instance.run()

    console.log('Finished running automodule!\n')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
