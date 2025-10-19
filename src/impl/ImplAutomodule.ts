import { Automodule, BaseAutomoduleOptions } from '../types'
import AbstractAutomodule from './AbstractAutomodule'

export default class ImplAutomodule extends AbstractAutomodule {
    public static Class?: ImplAutomoduleConstructor

    private interfaceName: string
    private implName: string

    protected constructor(options: ImplAutomoduleOptions) {
        const {
            testSaveDir,
            moduleSaveDir,
            fakeSaveDir,
            interfaceName,
            implName,
        } = options

        super({
            testSaveDir,
            moduleSaveDir,
            fakeSaveDir,
        })

        this.interfaceName = interfaceName
        this.implName = implName
    }

    public static Create(options: ImplAutomoduleOptions) {
        return new (this.Class ?? this)(options)
    }

    public async run() {
        await this.runAbstract({
            testFileName: `${this.implName}.test.ts`,
            testFileContent: this.testFilePattern,
            moduleFileName: `${this.implName}.ts`,
            moduleFileContent: this.moduleFilePattern,
            fakeFileName: `Fake${this.interfaceName}.ts`,
            fakeFileContent: this.fakeFilePattern,
            indexFileContent: this.indexFilePattern,
        })
    }

    private get testFilePattern() {
        return `
            import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
            import ${this.implName}, { ${this.interfaceName} } from '../../impl/${this.implName}'

            export default class ${this.implName}Test extends AbstractSpruceTest {
                private static instance: ${this.interfaceName}

                protected static async beforeEach() {
                    await super.beforeEach()

                    this.instance = this.${this.implName}()
                }
                
                @test()
                protected static async createsInstance() {
                    assert.isTruthy(this.instance, 'Failed to create instance!')
                }
                
                private static ${this.implName}() {
                    return ${this.implName}.Create()
                }
            }
        `
    }

    private get moduleFilePattern() {
        return `
            export default class ${this.implName} implements ${this.interfaceName} {
                public static Class?: ${this.interfaceName}Constructor
                
                protected constructor() {}
                
                public static Create() {
                    return new (this.Class ?? this)()
                }
            }

            export interface ${this.interfaceName} {}

            export type ${this.interfaceName}Constructor = new () => ${this.interfaceName}
        `
    }

    private get fakeFilePattern() {
        return `
            import { ${this.interfaceName} } from '../../impl/${this.implName}'

            export default class Fake${this.interfaceName} implements ${this.interfaceName} {
                public static numCallsToConstructor = 0
                
                public constructor() {
                    Fake${this.interfaceName}.numCallsToConstructor++
                }
                
                public static resetTestDouble() {
                    Fake${this.interfaceName}.numCallsToConstructor = 0
                }
            }
        `
    }

    private get indexFilePattern() {
        return `
            // ${this.interfaceName}

            export { default as ${this.implName} } from './impl/${this.implName}'
            export * from './impl/${this.implName}'

            export { default as Fake${this.interfaceName} } from './testDoubles/${this.interfaceName}/Fake${this.interfaceName}'
            export * from './testDoubles/${this.interfaceName}/Fake${this.interfaceName}'
        `
    }
}

export type ImplAutomoduleConstructor = new (
    options: ImplAutomoduleOptions
) => Automodule

export interface ImplAutomoduleOptions extends BaseAutomoduleOptions {
    interfaceName: string
    implName: string
}
