import { exec as execSync } from 'child_process'
import NpmAutopackage from '../modules/NpmAutopackage'

async function main() {
    console.log('Running autopackage...')

    await NpmAutopackage.Create({
        name: 'node-osf',
        description: 'Node.js client for the Open Science Framework (OSF) API',
        gitNamespace: 'neurodevs',
        npmNamespace: 'neurodevs',
        installDir: '/Users/ericthecurious/dev',
        license: 'MIT',
        author: 'Eric Yates <hello@ericthecurious.com>',
    })

    console.log('Opening in VSCode...')
    execSync('code .')
    console.log('Done!')

    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
