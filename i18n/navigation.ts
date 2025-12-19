import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

const { Link, redirect, usePathname, useRouter: useI18nRouter, getPathname } = createNavigation(routing)

export { Link, redirect, useI18nRouter, usePathname, getPathname }
