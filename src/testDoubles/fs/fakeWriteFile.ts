export let callsToWriteFile: {
    file: string
    data: string
}[] = []

export function resetCallsToWriteFile() {
    callsToWriteFile = []
}

export default async function fakeWriteFile(file: string, data: string) {
    callsToWriteFile.push({ file, data })
}
