import { generateId } from '@sprucelabs/test-utils'

export let callsToReadFile: string[] = []

export function resetCallsToReadFile() {
    callsToReadFile = []
}

export let fakeReadFileResult = generateId()

export function setFakeReadFileResult(result: string) {
    fakeReadFileResult = result
}

export default async function fakeReadFile(file: string) {
    callsToReadFile.push(file)
    return fakeReadFileResult
}
