import expandHomeDir from '../functions/expandHomeDir.js'
import NpmAutopackage from '../impl/NpmAutopackage.js'

async function main() {
    console.log('Running autopackage...')

    const instance = NpmAutopackage.Create({
        installDir: expandHomeDir('~/dev'),
        name: 'meta-node',
    })

    await instance.run()
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
