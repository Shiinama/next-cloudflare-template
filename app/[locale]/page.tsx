import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { ImageGenerator } from '@/components/image-generator/image-generator'
import ContentSections from '@/components/ui/content-sections'
import FAQSections from '@/components/ui/faq-sections'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home')

  return {
    title: t('metaTitle'),
    description: t('metaDescription')
  }
}

export default async function Home() {
  const t = await getTranslations('home')

  // Reconstruct the sections array from the flattened structure
  const contentSections = [
    {
      title: t('contentSections.section1Title'),
      content: [
        t('contentSections.section1Content1'),
        t('contentSections.section1Content2'),
        t('contentSections.section1Content3')
      ],
      image: {
        src: 'https://static.getwhynot.org/1754213623532-vintage-cassette-tape--warm-li-1024x1024.png',
        alt: 'vintage cassette tape, warm lighting, nostalgic atmosphere, close-up'
      }
    },
    {
      title: t('contentSections.section2Title'),
      content: [
        t('contentSections.section2Content1'),
        t('contentSections.section2Content2'),
        t('contentSections.section2Content3')
      ],
      image: {
        src: 'https://static.getwhynot.org/1754213671461-retro-computer--early-speech-s-1024x1024.png',
        alt: 'retro computer, early speech synthesizer, 1980s technology, laboratory setting'
      }
    },
    {
      title: t('contentSections.section3Title'),
      content: [
        t('contentSections.section3Content1'),
        t('contentSections.section3Content2'),
        t('contentSections.section3Content3')
      ],
      image: {
        src: 'https://static.getwhynot.org/1754213711434-AI-voice-waveform-visualizatio-1024x1024.png',
        alt: 'AI voice waveform visualization, digital audio spectrum, futuristic interface, blue glow'
      }
    },
    {
      title: t('contentSections.section4Title'),
      content: [t('contentSections.section4Content1')],
      image: {
        src: 'https://static.getwhynot.org/1754213760592-musical-notes-floating--AI-mus-1024x1024.png',
        alt: 'musical notes floating, AI music creation, digital sound waves, creative studio'
      }
    },
    {
      title: t('contentSections.section5Title'),
      content: [
        t('contentSections.section5Content1'),
        t('contentSections.section5Content2'),
        t('contentSections.section5Content3')
      ],
      image: {
        src: 'https://static.getwhynot.org/1754213844196-emotional-voice-visualization--1024x1024.png',
        alt: 'emotional voice visualization, heart-shaped sound waves, warm colors, human connection'
      }
    },
    {
      title: t('contentSections.section6Title'),
      content: [t('contentSections.section6Content1'), t('contentSections.section6Content2')],
      image: {
        src: 'https://static.getwhynot.org/1754213877479-data-streams--human-silhouette-1024x1024.png',
        alt: 'data streams, human silhouette, emotional particles, abstract digital art'
      }
    },
    {
      title: t('contentSections.section7Title'),
      content: [
        t('contentSections.section7Content1'),
        t('contentSections.section7Content2'),
        t('contentSections.section7Content3'),
        t('contentSections.section7Content4')
      ],
      image: {
        src: 'https://static.getwhynot.org/1754213903175-human-voice-meeting-AI--bridge-1024x1024.png',
        alt: 'human voice meeting AI, bridge of light, harmony, future technology'
      }
    }
  ]

  // FAQ sections
  const faqSections = [
    {
      question: t('faq.question1'),
      answer: t('faq.answer1')
    },
    {
      question: t('faq.question2'),
      answer: t('faq.answer2')
    },
    {
      question: t('faq.question3'),
      answer: t('faq.answer3')
    },
    {
      question: t('faq.question4'),
      answer: t('faq.answer4')
    },
    {
      question: t('faq.question5'),
      answer: t('faq.answer5')
    }
  ]

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-primary mb-4 text-4xl font-bold md:text-5xl">{t('title')}</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">{t('description')}</p>
      </div>
      <section id="generator" className="mt-12">
        <div className="bg-muted/30 mx-auto max-w-3xl rounded-3xl border p-6 shadow-md">
          <h2 className="text-foreground mb-4 text-2xl font-semibold md:text-3xl">{t('imageGenerator.title')}</h2>
          <p className="text-muted-foreground mb-6 text-base">{t('imageGenerator.description')}</p>
          <ImageGenerator />
        </div>
      </section>

      <div className="mt-20">
        <ContentSections sections={contentSections} className="mt-12" />
      </div>

      <div className="mt-20">
        <h2 className="text-primary mb-8 text-center text-3xl font-bold">{t('faq.title')}</h2>
        <FAQSections faqs={faqSections} />
      </div>
    </>
  )
}
