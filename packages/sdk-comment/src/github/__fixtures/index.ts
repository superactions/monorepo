import { readFileSync } from 'fs'
import { join } from 'path'

export const fixtures = {
  prContext: JSON.parse(readFileSync(join(__dirname, './pr-context.json'), 'utf-8')),
  pushContext: JSON.parse(readFileSync(join(__dirname, './push-context.json'), 'utf-8')),
}
