import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionsProps {
  className?: string
  faqs?: FAQItem[]
}

export default function FAQSections({ className, faqs = [] }: FAQSectionsProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {faqs.map((faq, index) => (
        <div key={index} className="bg-card rounded-lg border p-8 shadow">
          <h3 className="text-primary mb-4 text-xl font-bold">{faq.question}</h3>
          <p className="text-muted-foreground">{faq.answer}</p>
        </div>
      ))}
    </div>
  )
}
