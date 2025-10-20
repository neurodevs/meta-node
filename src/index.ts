// Autocloner

export { default as GitAutocloner } from './impl/GitAutocloner'
export * from './impl/GitAutocloner'

export { default as FakeAutocloner } from './testDoubles/Autocloner/FakeAutocloner'
export * from './testDoubles/Autocloner/FakeAutocloner'

// Autodocumenter

export { default as PackageAutodocumenter } from './impl/PackageAutodocumenter'
export * from './impl/PackageAutodocumenter'

export { default as FakeAutodocumenter } from './testDoubles/Autodocumenter/FakeAutodocumenter'
export * from './testDoubles/Autodocumenter/FakeAutodocumenter'

// Automodule

export { default as AbstractAutomodule } from './impl/AbstractAutomodule'
export * from './impl/AbstractAutomodule'

export { default as ImplAutomodule } from './impl/ImplAutomodule'
export * from './impl/ImplAutomodule'

export { default as UiAutomodule } from './impl/UiAutomodule'
export * from './impl/UiAutomodule'

export { default as FakeAutomodule } from './testDoubles/Automodule/FakeAutomodule'
export * from './testDoubles/Automodule/FakeAutomodule'

// Autopackage

export { default as NpmAutopackage } from './impl/NpmAutopackage'
export * from './impl/NpmAutopackage'

export { default as FakeAutopackage } from './testDoubles/Autopackage/FakeAutopackage'
export * from './testDoubles/Autopackage/FakeAutopackage'

// SnippetKeybinder

export { default as VscodeSnippetKeybinder } from './impl/VscodeSnippetKeybinder'
export * from './impl/VscodeSnippetKeybinder'

export { default as FakeSnippetKeybinder } from './testDoubles/SnippetKeybinder/FakeSnippetKeybinder'
export * from './testDoubles/SnippetKeybinder/FakeSnippetKeybinder'

// SnippetSuite

export { default as TypescriptClassSnippetSuite } from './impl/TypescriptClassSnippetSuite'
export * from './impl/TypescriptClassSnippetSuite'

export { default as FakeSnippetSuite } from './testDoubles/SnippetSuite/FakeSnippetSuite'
export * from './testDoubles/SnippetSuite/FakeSnippetSuite'
