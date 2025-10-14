import { pathExists } from 'fs-extra'
import { Automodule, BaseAutomoduleOptions } from '../types'
import AbstractAutomodule from './AbstractAutomodule'

export default class UiAutomodule
    extends AbstractAutomodule
    implements Automodule
{
    public static Class?: UiAutomoduleConstructor
    public static pathExists = pathExists

    protected componentName: string
    protected componentNameKebabCase: string

    protected constructor(options: UiAutomoduleOptions) {
        const { testSaveDir, moduleSaveDir, fakeSaveDir, componentName } =
            options

        super({
            testSaveDir,
            moduleSaveDir,
            fakeSaveDir,
        })

        this.componentName = componentName
        this.componentNameKebabCase = this.toKebabCase(componentName)
    }

    public static Create(options: UiAutomoduleOptions) {
        return new (this.Class ?? this)(options)
    }

    private toKebabCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase()
    }

    public async run() {
        await this.runAbstract({
            testFileName: `${this.componentName}.test.tsx`,
            testFileContent: this.testFileTemplate,
            moduleFileName: `${this.componentName}.tsx`,
            moduleFileContent: this.moduleFilePattern,
        })
    }

    private get testFileTemplate() {
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

    private get moduleFilePattern() {
        return `
            import React from 'react'

            const ${this.componentName}: React.FC = () => {
                return (
                    <div
                        className="${this.componentNameKebabCase}"
                        data-testid="${this.componentNameKebabCase}"
                    />
                )
            }

            export default ${this.componentName}
        `
    }
}

export type UiAutomoduleConstructor = new (
    options: UiAutomoduleOptions
) => Automodule

export interface UiAutomoduleOptions extends BaseAutomoduleOptions {
    componentName: string
}
