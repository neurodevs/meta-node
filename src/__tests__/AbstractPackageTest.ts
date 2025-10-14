import AbstractSpruceTest from '@sprucelabs/test-utils'

export default class AbstractPackageTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    protected static normalize(input: string) {
        return input.replace(/\s+/g, ' ').trim()
    }
}
