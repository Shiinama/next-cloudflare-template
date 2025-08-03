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
  imagePosition?: 'left' | 'right'
}

export default function TextImageSections({
  className,
  sections = [],
  imagePosition = 'right'
}: TextImageSectionsProps) {
  return (
    <div className={cn('space-y-12', className)}>
      {sections.map((section, index) => (
        <section key={index} className={cn('rounded-lg border p-8 shadow')}>
          <div
            className={cn(
              'grid grid-cols-1 items-start gap-8 lg:grid-cols-2',
              imagePosition === 'left' && 'lg:grid-flow-col-dense'
            )}
          >
            {/* 文字内容 */}
            <div className={cn('space-y-4', imagePosition === 'left' && 'lg:col-start-2')}>
              <h3 className="text-primary mb-6 text-2xl font-bold">{section.title}</h3>
              {section.content.map((paragraph, pIndex) => (
                <MarkdownRender content={paragraph} key={pIndex} />
              ))}
            </div>

            {/* 图片 */}
            <div
              className={cn(
                'flex justify-center',
                imagePosition === 'left' ? 'lg:col-start-1 lg:justify-start' : 'lg:justify-end'
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
          </div>
        </section>
      ))}
    </div>
  )
}
