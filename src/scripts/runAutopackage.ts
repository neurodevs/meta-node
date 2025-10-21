import NpmAutopackage from '../impl/NpmAutopackage'
import expandHomeDir from '../functions/expandHomeDir'

async function main() {
    console.log('Running autopackage...')

    const instance = NpmAutopackage.Create({
        name: 'node-osf',
        description: 'Node.js client for the Open Science Framework (OSF) API',
        gitNamespace: 'neurodevs',
        npmNamespace: 'neurodevs',
        installDir: expandHomeDir('~/dev'),
        license: 'MIT',
        author: 'Eric Yates <hello@ericthecurious.com>',
    })

    await instance.run()
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
