import ElevenLabsContainer from '@/components/elevenlabs/elevenlabs-container'

export default async function Home() {
  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="from-primary to-accent mb-4 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          Simple AI Voice Generator
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Experience the most powerful AI audio generation technology available today
        </p>
      </div>
      <ElevenLabsContainer />
    </>
  )
}
