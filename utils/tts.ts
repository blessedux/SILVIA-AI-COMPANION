export async function textToSpeech(text: string): Promise<string> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.7,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    })

    if (!response.ok) {
      throw new Error('Error al generar audio')
    }

    // Convert the response to a blob
    const audioBlob = await response.blob()
    
    // Create a URL for the blob
    const audioUrl = URL.createObjectURL(audioBlob)
    
    return audioUrl
  } catch (error) {
    console.error('Error in textToSpeech:', error)
    throw error
  }
} 