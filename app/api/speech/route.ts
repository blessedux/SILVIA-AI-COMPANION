import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: Request) {
  console.log('Starting speech recognition route handler')
  
  try {
    const contentType = request.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    if (!contentType?.includes('multipart/form-data')) {
      console.error('Invalid content type')
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      )
    }

    // Create a temporary file for the audio
    const tempDir = tmpdir()
    console.log('Using temp directory:', tempDir)
    const audioPath = join(tempDir, 'audio.webm')
    console.log('Will write audio to:', audioPath)

    try {
      // Parse the form data
      const formData = await request.formData()
      console.log('FormData parsed successfully')
      
      const audioFile = formData.get('audio') as File
      
      if (!audioFile) {
        console.error('No audio file provided')
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        )
      }

      console.log('Audio file received:', {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      })

      const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
      console.log('Audio buffer created, size:', audioBuffer.length)
      
      await writeFile(audioPath, audioBuffer)
      console.log('Audio file written successfully')
    } catch (error) {
      console.error('Error processing audio file:', error)
      return NextResponse.json(
        { error: 'Failed to process audio file' },
        { status: 500 }
      )
    }

    // Create a temporary Python script
    const scriptPath = join(tempDir, 'transcribe.py')
    console.log('Creating Python script at:', scriptPath)
    
    const scriptContent = `
import torch
import torchaudio
from silero import silero_stt
import soundfile as sf
import numpy as np
import sys
import json
import os

def transcribe_audio(audio_path):
    try:
        print("Loading audio file...")
        if not os.path.exists(audio_path):
            print(f"Error: Audio file not found at {audio_path}")
            return None
            
        # Load the audio file
        audio, sample_rate = sf.read(audio_path)
        print(f"Audio loaded: shape={audio.shape}, sample_rate={sample_rate}")
        
        # Convert to mono if stereo
        if len(audio.shape) > 1:
            print("Converting to mono...")
            audio = np.mean(audio, axis=1)
        
        # Resample to 16kHz if needed
        if sample_rate != 16000:
            print("Resampling to 16kHz...")
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            audio = torch.from_numpy(audio).float()
            audio = resampler(audio)
            audio = audio.numpy()
        
        print("Initializing Silero STT...")
        # Initialize Silero STT
        model, decoder, utils = silero_stt()
        
        # Prepare audio for the model
        audio = torch.from_numpy(audio).float()
        
        print("Transcribing...")
        # Transcribe
        result = model(audio)
        text = decoder(result[0].cpu())
        print(f"Transcription result: {text}")
        
        return text
    except Exception as e:
        print(f"Error in transcription: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    audio_path = sys.argv[1]
    print(f"Starting transcription for: {audio_path}")
    result = transcribe_audio(audio_path)
    if result:
        print(json.dumps({"text": result}))
    else:
        print(json.dumps({"error": "Transcription failed"}))
    `

    try {
      await writeFile(scriptPath, scriptContent)
      console.log('Python script written successfully')
    } catch (writeError) {
      console.error('Error writing Python script:', writeError)
      return NextResponse.json(
        { error: 'Failed to write Python script' },
        { status: 500 }
      )
    }

    // Run the Python script
    console.log('Starting Python process...')
    const pythonProcess = spawn('python3', [scriptPath, audioPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    let output = ''
    let error = ''

    pythonProcess.stdout.on('data', (data) => {
      const dataStr = data.toString()
      console.log('Python stdout:', dataStr)
      output += dataStr
    })

    pythonProcess.stderr.on('data', (data) => {
      const dataStr = data.toString()
      console.error('Python stderr:', dataStr)
      error += dataStr
    })

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err)
      return NextResponse.json(
        { error: 'Failed to start transcription process' },
        { status: 500 }
      )
    })

    return new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        console.log('Python process exited with code:', code)
        console.log('Python output:', output)
        console.log('Python error:', error)
        
        if (code !== 0) {
          resolve(
            NextResponse.json(
              { error: `Transcription failed: ${error}` },
              { status: 500 }
            )
          )
          return
        }

        try {
          const result = JSON.parse(output)
          if (result.error) {
            resolve(
              NextResponse.json(
                { error: result.error },
                { status: 500 }
              )
            )
          } else {
            resolve(
              NextResponse.json(
                { text: result.text },
                { status: 200 }
              )
            )
          }
        } catch (e) {
          console.error('Failed to parse Python output:', e)
          resolve(
            NextResponse.json(
              { error: 'Failed to parse transcription result' },
              { status: 500 }
            )
          )
        }
      })
    })
  } catch (error) {
    console.error('Error processing audio:', error)
    return NextResponse.json(
      { error: 'Error processing audio' },
      { status: 500 }
    )
  }
} 