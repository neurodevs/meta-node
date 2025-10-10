import { access } from 'fs/promises'

export default async function pathExists(path: string) {
    try {
        await access(path)
        return true
    } catch {
        return false
    }
}
