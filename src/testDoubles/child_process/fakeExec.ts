import { ChildProcess } from 'child_process'

export let callsToExec: string[] = []

export function resetCallsToExec() {
    callsToExec = []
}

export let fakeExecResult: ChildProcess = {} as ChildProcess

export function setFakeExecResult(result: ChildProcess) {
    fakeExecResult = result
}

export default async function fakeExec(command: string) {
    callsToExec.push(command)
    return fakeExecResult
}
