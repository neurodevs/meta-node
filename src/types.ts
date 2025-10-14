export interface Automodule {
    run(): Promise<void>
}

export interface BaseAutomoduleOptions {
    testSaveDir: string
    moduleSaveDir: string
    fakeSaveDir: string
}
