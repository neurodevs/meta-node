import { test, assert, generateId } from '@sprucelabs/test-utils'
import { callsToWriteFile } from '@neurodevs/fake-node-core'
import UiAutomodule from '../../modules/UiAutomodule'
import AbstractAutomoduleTest from '../AbstractAutomoduleTest'

export default class UiAutomoduleTest extends AbstractAutomoduleTest {
    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.UiAutomodule()
    }

    @test()
    protected static async passesAbstractTests() {
        await this.runAbstractTests()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsTestFileAsExpected() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[0],
            {
                file: `${this.testSaveDir}/${this.componentName}.test.tsx`,
                data: this.testFilePattern,
                options: undefined,
            },
            'Did not write expected test file!'
        )
    }

    private static readonly componentName = generateId()

    private static get testFilePattern() {
        return `
            import { test, assert } from '@sprucelabs/test-utils'
            import { render, RenderResult } from '@testing-library/react'
            import ${this.componentName} from '../../ui/${this.componentName}'
            import AbstractPackageTest from '../AbstractPackageTest'

            export default class ${this.componentName}Test extends AbstractPackageTest {
                private static result: RenderResult

                protected static async beforeEach() {
                    await super.beforeEach()

                    this.result = this.render()
                }

                @test()
                protected static async rendersComponent() {
                    assert.isTruthy(this.result, 'Failed to render component!')
                }

                @test()
                protected static async rendersTopLevelDivWithExpectedClass() {
                    assert.isEqual(
                        this.div.className,
                        this.className,
                        'Incorrect class for top-level div!'
                    )
                }

                private static get div() {
                    return this.getByTestId(this.className)
                }

                private static get getByTestId() {
                    return this.result.getByTestId
                }

                private static readonly className = '${this.toKebabCase(this.componentName)}'

                protected static render() {
                    return render(<${this.componentName} />)
                }
            }
        `
    }

    private static toKebabCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase()
    }

    private static UiAutomodule() {
        return UiAutomodule.Create({
            testSaveDir: this.testSaveDir,
            moduleSaveDir: this.moduleSaveDir,
            fakeSaveDir: this.fakeSaveDir,
            componentName: this.componentName,
        })
    }
}
