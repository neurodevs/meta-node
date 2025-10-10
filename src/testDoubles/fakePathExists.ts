export let pathShouldExist = true

export function setPathShouldExist(shouldExist: boolean) {
    pathShouldExist = shouldExist
}

export default async function fakePathExists(_path: string) {
    return pathShouldExist
}
