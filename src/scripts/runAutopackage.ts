import { execSync } from 'child_process'
import NpmAutopackage from '../modules/NpmAutopackage'

async function run() {
    console.log('Running...')

    await NpmAutopackage.Create({
        name: 'node-xyz',
        description: 'XYZ, yo',
        gitNamespace: 'neurodevs',
        npmNamespace: 'neurodevs',
        installDir: '/Users/ericthecurious/dev',
    })

    console.log('Opening in VSCode...')
    execSync('code .')
    console.log('Done!')

    process.exit(0)
}

run().catch((err) => {
    console.error(err)
    process.exit(1)
})
