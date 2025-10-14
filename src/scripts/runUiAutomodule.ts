import UiAutomodule from '../modules/UiAutomodule'

async function main() {
    console.log('\nRunning automodule...')

    const instance = UiAutomodule.Create({
        testSaveDir:
            '/Users/ericthecurious/dev/meta-node/src/__tests__/modules',
        moduleSaveDir: '/Users/ericthecurious/dev/meta-node/src/modules',
        fakeSaveDir:
            '/Users/ericthecurious/dev/meta-node/src/testDoubles/Autothingy',
        componentName: 'Autothingy',
    })

    await instance.run()

    console.log('Finished running automodule!\n')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
