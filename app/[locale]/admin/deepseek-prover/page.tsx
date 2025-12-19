import { DeepSeekProver } from '@/components/deepseek-prover/deepseek-prover'

export default function DeepSeekProverPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">DeepSeek Prover AI</h1>
      <p className="mb-6 text-gray-600">Enter a prompt to generate a response using the DeepSeek Prover V2 model.</p>

      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <DeepSeekProver />
      </div>
    </div>
  )
}
