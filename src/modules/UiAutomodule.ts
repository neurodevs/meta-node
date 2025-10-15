import { pathExists } from 'fs-extra'
import { Automodule, BaseAutomoduleOptions } from '../types'
import AbstractAutomodule from './AbstractAutomodule'

export default class UiAutomodule extends AbstractAutomodule {
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
        await this.runAbstractAutomodule()
    }

    private async runAbstractAutomodule() {
        await this.runAbstract({
            testFileName: `${this.componentName}.test.tsx`,
            testFileContent: this.testFileTemplate,
            moduleFileName: `${this.componentName}.tsx`,
            moduleFileContent: this.moduleFilePattern,
            fakeFileName: `Fake${this.componentName}.tsx`,
            fakeFileContent: this.fakeFilePattern,
            indexFileContent: this.indexFilePattern,
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

            export interface ${this.componentName}Props {}

            const ${this.componentName}: React.FC<${this.componentName}Props> = (_props: ${this.componentName}Props) => {
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

    private get fakeFilePattern() {
        return `
            import React from 'react'
            import { ${this.componentName}Props } from '../../ui/${this.componentName}'

            export let last${this.componentName}Props: ${this.componentName}Props | undefined

            const Fake${this.componentName}: React.FC<${this.componentName}Props> = (
                props: ${this.componentName}Props
            ) => {
                last${this.componentName}Props = props

                return (
                    <div data-testid="${this.componentNameKebabCase}" />
                )
            }

            export default Fake${this.componentName}
        `
    }

    private get indexFilePattern() {
        return `
            // ${this.componentName}

            export { default as ${this.componentName} } from './ui/${this.componentName}'
            export * from './ui/${this.componentName}'

            export { default as Fake${this.componentName} } from './testDoubles/${this.componentName}/Fake${this.componentName}'
            export * from './testDoubles/${this.componentName}/Fake${this.componentName}'

        `
    }
}

export type UiAutomoduleConstructor = new (
    options: UiAutomoduleOptions
) => Automodule

export interface UiAutomoduleOptions extends BaseAutomoduleOptions {
    componentName: string
}
