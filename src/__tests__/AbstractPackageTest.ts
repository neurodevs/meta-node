import AbstractSpruceTest, { generateId } from '@sprucelabs/test-utils'

export default class AbstractPackageTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    protected static normalize(input: string) {
        return input.replace(/\s+/g, ' ').trim()
    }

    protected static readonly testSaveDir = generateId()
    protected static readonly moduleSaveDir = generateId()
    protected static readonly fakeSaveDir = generateId()
}
