import NpmReleasePropagator from '../impl/NpmReleasePropagator.js'

const propagator = NpmReleasePropagator.Create({
    packageName: '@neurodevs/node-tdd',
    packageVersion: '0.2.3',
    repoPaths: ['/Users/ericthecurious/dev/node-ble'],
})

await propagator.run()
