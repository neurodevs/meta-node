import { test, assert, generateId } from '@sprucelabs/test-utils'
import {
    callsToExec,
    callsToWriteFile,
    setFakeReadFileResult,
    setFakeReadFileThrowsFor,
} from '@neurodevs/fake-node-core'
import UiAutomodule from '../../impl/UiAutomodule'
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

    @test()
    protected static async createsModuleFileAsExpected() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[1],
            {
                file: `${this.moduleSaveDir}/${this.componentName}.tsx`,
                data: this.moduleFilePattern,
                options: undefined,
            },
            'Did not write expected module file!'
        )
    }

    @test()
    protected static async createsFakeFileAsExpected() {
        await this.run()

        assert.isEqualDeep(
            callsToWriteFile[2],
            {
                file: `${this.fakeSaveDir}/Fake${this.componentName}.tsx`,
                data: this.fakeFilePattern,
                options: undefined,
            },
            'Did not write expected module file!'
        )
    }

    @test()
    protected static async updatesIndexFileExportsAndSortsAlphabetically() {
        setFakeReadFileResult(this.indexFilePath, this.originalIndexFile)

        await this.run()

        const call = callsToWriteFile[3]

        assert.isEqualDeep(
            {
                file: call.file,
                data: this.normalize(call.data),
            },
            {
                file: this.indexFilePath,
                data: this.normalize(this.sortedIndexFile),
            },
            'Did not update index file exports as expected!'
        )
    }

    @test()
    protected static async triesBackupIndexFilePathIfNotFound() {
        setFakeReadFileThrowsFor(this.indexFilePath)
        setFakeReadFileResult('./src/exports.ts', this.originalIndexFile)

        await this.run()

        const call = callsToWriteFile[3]

        assert.isEqualDeep(
            {
                file: call.file,
                data: this.normalize(call.data),
            },
            {
                file: './src/exports.ts',
                data: this.normalize(this.sortedIndexFile),
            },
            'Did not update index file as expected!'
        )
    }

    @test()
    protected static async bumpsMinorVersionWithYarn() {
        await this.run()

        assert.isEqualDeep(
            callsToExec[0],
            'yarn version --minor --no-git-tag-version',
            'Did not bump minor version!'
        )
    }

    private static readonly componentName = generateId()

    private static readonly componentNameKebabCase = this.toKebabCase(
        this.componentName
    )

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

                private static readonly className = '${this.componentNameKebabCase}'

                protected static render() {
                    return render(<${this.componentName} />)
                }
            }
        `
    }

    private static get moduleFilePattern() {
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

    private static get fakeFilePattern() {
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

    private static get indexFilePattern() {
        return `
            // ${this.componentName}

            export { default as ${this.componentName} } from './ui/${this.componentName}'
            export * from './ui/${this.componentName}'

            export { default as Fake${this.componentName} } from './testDoubles/${this.componentName}/Fake${this.componentName}'
            export * from './testDoubles/${this.componentName}/Fake${this.componentName}'

        `
    }

    private static get sortedIndexFile() {
        const blocks = `${this.originalIndexFile}${this.indexFilePattern}`
            .split(/(?=\/\/)/)
            .map((s) => s.trim())
            .filter(Boolean)

        blocks.sort((a, b) => {
            const aKey = a.match(/^\/\/\s*([^\n]*)/)?.[1]?.trim() ?? ''
            const bKey = b.match(/^\/\/\s*([^\n]*)/)?.[1]?.trim() ?? ''
            return aKey.localeCompare(bKey)
        })

        return blocks.join('\n\n')
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
