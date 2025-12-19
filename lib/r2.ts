import { getCloudflareContext } from '@opennextjs/cloudflare'

export const createR2 = () => getCloudflareContext().env.STATIC
