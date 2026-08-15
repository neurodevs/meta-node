import os from 'node:os'
import path from 'node:path'

export default function expandHomeDir(inputPath: string): string {
    return inputPath.startsWith('~')
        ? path.join(os.homedir(), inputPath.slice(1))
        : inputPath
}
