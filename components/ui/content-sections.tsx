import Image from 'next/image'

import MarkdownRender from '@/components/markdown/mark-down-render'
import { cn } from '@/lib/utils'

interface TextImageSection {
  title: string
  content: string[]
  image: {
    src: string
    alt: string
  }
}

interface TextImageSectionsProps {
  className?: string
  sections?: TextImageSection[]
}

export default function TextImageSections({ className, sections = [] }: TextImageSectionsProps) {
  return (
    <div className={cn('space-y-12', className)}>
      {sections.map((section, index) => {
        const currentImagePosition = index % 2 === 0 ? 'right' : 'left'

        return (
          <section
            key={index}
            className={cn(
              'grid grid-cols-1 items-start gap-8 lg:grid-cols-2',
              currentImagePosition === 'left' && 'lg:grid-flow-col-dense'
            )}
          >
            <div className={cn('space-y-4', currentImagePosition === 'left' && 'lg:col-start-2')}>
              <h2 className="text-primary mb-6 text-2xl font-bold">{section.title}</h2>
              {section.content.map((paragraph, pIndex) => (
                <MarkdownRender content={paragraph} key={pIndex} />
              ))}
            </div>

            <div
              className={cn(
                'flex justify-center',
                currentImagePosition === 'left' ? 'lg:col-start-1 lg:justify-start' : 'lg:justify-end'
              )}
            >
              <Image
                src={section.image.src}
                alt={section.image.alt}
                width={400}
                height={300}
                className="w-full max-w-md rounded-lg object-cover"
              />
            </div>
          </section>
        )
      })}
    </div>
  )
}
