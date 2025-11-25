
            import AbstractModuleTest, { test, assert } from '@neurodevs/node-tdd'

            import InterfaceImpl, { Interface } from '../../impl/InterfaceImpl.js'

            export default class InterfaceImplTest extends AbstractModuleTest {
                private static instance: Interface

                protected static async beforeEach() {
                    await super.beforeEach()

                    this.instance = this.InterfaceImpl()
                }
                
                @test()
                protected static async createsInstance() {
                    assert.isTruthy(this.instance, 'Failed to create instance!')
                }
                
                private static InterfaceImpl() {
                    return InterfaceImpl.Create()
                }
            }
        