import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'

export const maxDuration = 300

const execFileAsync = promisify(execFile)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const YTDLP = process.platform === 'win32'
  ? 'yt-dlp.exe'
  : 'yt-dlp'

const FFMPEG = process.platform === 'win32'
  ? 'ffmpeg.exe'
  : 'ffmpeg'

const COOKIES_PATH = join(process.cwd(), 'cookies.txt')

async function cookiesArgs() {
  try {
    await import('fs/promises').then(fs => fs.access(COOKIES_PATH))
    return ['--cookies', COOKIES_PATH]
  } catch {
    return []
  }
}

async function downloadReel(url, outPath) {
  const cookies = await cookiesArgs()
  await execFileAsync(YTDLP, [
    '--format', 'best[ext=mp4]/best',
    '--output', outPath,
    '--quiet',
    '--no-playlist',
    ...cookies,
    url,
  ])
}

async function getVideoInfo(url) {
  try {
    const cookies = await cookiesArgs()
    const { stdout } = await execFileAsync(YTDLP, [
      '--dump-json',
      '--getcomments',
      '--quiet',
      '--no-playlist',
      ...cookies,
      url,
    ])
    const info = JSON.parse(stdout.trim())
    const creator = info.uploader || info.creator || 'Unknown'
    const comments = (info.comments || [])
      .slice(0, 5)
      .map(c => c.text)
      .filter(Boolean)
    return { creator, comments }
  } catch {
    return { creator: 'Unknown', comments: [] }
  }
}

async function extractFrames(videoPath, tmpDir) {
  const framePaths = []
  const b64Frames = []

  // Get video duration
  let duration = 30
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath,
    ])
    duration = parseFloat(stdout.trim()) || 30
  } catch { /* use default */ }

  const timestamps = [1, Math.floor(duration * 0.5), Math.floor(duration * 0.9)]

  for (let i = 0; i < timestamps.length; i++) {
    const framePath = join(tmpDir, `frame_${i}.jpg`)
    try {
      await execFileAsync(FFMPEG, [
        '-y', '-ss', String(timestamps[i]),
        '-i', videoPath,
        '-frames:v', '1',
        '-vf', 'scale=1080:-1',
        '-q:v', '2',
        framePath,
      ])
      const buf = await readFile(framePath)
      b64Frames.push(`data:image/jpeg;base64,${buf.toString('base64')}`)
      framePaths.push(framePath)
    } catch { /* skip this frame */ }
  }

  return { framePaths, b64Frames }
}

async function extractAudio(videoPath, tmpDir) {
  const audioPath = join(tmpDir, 'audio.mp3')
  await execFileAsync(FFMPEG, [
    '-y', '-i', videoPath,
    '-q:a', '0', '-map', 'a',
    audioPath,
  ])
  return audioPath
}

async function transcribe(audioPath) {
  const audioBuffer = await readFile(audioPath)
  const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' })
  const result = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audioFile,
  })
  return result.text
}

async function extractRecipe(transcript, manualIngredients, b64Frames, comments) {
  const imageMessages = b64Frames.map(url => ({
    type: 'image_url',
    image_url: { url },
  }))

  const commentBlock = comments.length > 0
    ? `TOP COMMENTS:\n${comments.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    : 'TOP COMMENTS: None available'

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a professional chef. Extract a structured recipe from the provided video frames, transcript, and comments. Format your response as:\n\n**Dish Title: [name]**\n\n**Ingredients:**\n- [ingredient with quantity]\n\n**Method:**\n[numbered steps]\n\nPriority for information: Manual overrides > Comments (creator often posts the full recipe here) > Visual text on screen > Audio transcript. Include ratio analysis where applicable.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `TRANSCRIPT: ${transcript}\n\n${commentBlock}\n\nMANUAL OVERRIDE: ${manualIngredients || 'None'}`,
          },
          ...imageMessages,
        ],
      },
    ],
  })

  return res.choices[0].message.content
}

function parseRecipe(markdown) {
  const data = { title: 'Untitled Recipe', ingredients: [] }

  const titleMatch = markdown.match(/\*\*Dish Title:\s*(.*?)\*\*/i)
  if (titleMatch) {
    data.title = titleMatch[1].trim()
  } else {
    const firstLine = markdown.split('\n').find(l => l.trim())
    if (firstLine) data.title = firstLine.replace(/^[#*\s]+/, '').trim()
  }

  const ingMatch = markdown.match(/\*\*Ingredients:\*\*(.*?)(?:\*\*Method:\*\*|\*\*Instructions:\*\*)/is)
  if (ingMatch) {
    data.ingredients = ingMatch[1]
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => l.replace(/^-\s*/, '').trim())
  }

  return data
}

async function cleanup(paths) {
  for (const p of paths) {
    try { await unlink(p) } catch { /* ignore */ }
  }
}

export async function POST(request) {
  const { url, manualIngredients = '' } = await request.json()

  if (!url) {
    return Response.json({ error: 'URL is required' }, { status: 400 })
  }

  const cleanUrl = url.split('?')[0]
  const tmpDir = await mkdtemp(join(tmpdir(), 'souschef-'))
  const videoPath = join(tmpDir, 'video.mp4')
  const allFiles = [videoPath]

  try {
    // Download video and fetch metadata+comments concurrently
    const [, { creator, comments }] = await Promise.all([
      downloadReel(cleanUrl, videoPath),
      getVideoInfo(cleanUrl),
    ])

    // Extract frames and audio in parallel
    const [{ framePaths, b64Frames }, audioPath] = await Promise.all([
      extractFrames(videoPath, tmpDir),
      extractAudio(videoPath, tmpDir),
    ])
    allFiles.push(...framePaths, audioPath)

    // Transcribe
    const transcript = await transcribe(audioPath)

    // Extract recipe with GPT-4o (comments included)
    const recipeMarkdown = await extractRecipe(transcript, manualIngredients, b64Frames, comments)

    // Parse
    const parsed = parseRecipe(recipeMarkdown)

    // Save to Supabase
    const supabase = createServerClient()

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title: parsed.title,
        category: creator,
        source_type: 'Instagram Extraction',
        source_url: cleanUrl,
        instructions_markdown: recipeMarkdown,
      })
      .select('id')
      .single()

    if (recipeError) throw new Error(recipeError.message)

    if (parsed.ingredients.length > 0) {
      await supabase.from('ingredients').insert(
        parsed.ingredients.map(raw_text => ({ recipe_id: recipe.id, raw_text }))
      )
    }

    return Response.json({
      id: recipe.id,
      title: parsed.title,
      recipe: recipeMarkdown,
      creator,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  } finally {
    await cleanup(allFiles)
    try { await execFileAsync('rmdir', [tmpDir]) } catch { /* ignore */ }
  }
}
