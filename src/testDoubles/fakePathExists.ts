export let pathShouldExist: Record<string, boolean> = {}

export function setPathShouldExist(path: string, shouldExist: boolean) {
    pathShouldExist[path] = shouldExist
}

export default async function fakePathExists(path: string) {
    return pathShouldExist[path]
}
