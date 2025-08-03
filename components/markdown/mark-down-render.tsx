import Markdown from 'markdown-to-jsx'

import CodeBlock from '@/components/markdown/code'
import Heading from '@/components/markdown/heading'
import ImageBlock from '@/components/markdown/img'
import PBlock from '@/components/markdown/p'
import VideoBlock from '@/components/markdown/video'

interface MarkdownRenderProps {
  content: string
}

const MarkdownRender = ({ content }: MarkdownRenderProps) => {
  return (
    <Markdown
      className="prose prose-violet prose-invert prose-code:before:hidden prose-code:after:hidden max-w-none"
      options={{
        overrides: {
          p: ({ children }) => <PBlock>{children}</PBlock>,
          h1: ({ children }) => <Heading level={1}>{children}</Heading>,
          h2: ({ children }) => <Heading level={2}>{children}</Heading>,
          h3: ({ children }) => <Heading level={3}>{children}</Heading>,
          h4: ({ children }) => <Heading level={4}>{children}</Heading>,
          h5: ({ children }) => <Heading level={5}>{children}</Heading>,
          h6: ({ children }) => <Heading level={6}>{children}</Heading>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => <CodeBlock className={className}>{children}</CodeBlock>,
          img: ({ src, alt }) => <ImageBlock src={src} alt={alt} />,
          CustomVideo: ({ src, title }) => <VideoBlock src={src} title={title} />
        }
      }}
    >
      {content}
    </Markdown>
  )
}

export default MarkdownRender
