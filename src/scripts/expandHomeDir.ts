import os from 'os'
import path from 'path'

export default function expandHomeDir(inputPath: string): string {
    return inputPath.startsWith('~')
        ? path.join(os.homedir(), inputPath.slice(1))
        : inputPath
}
