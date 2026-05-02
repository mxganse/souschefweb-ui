import PDFDocument from 'pdfkit'
import { createServerClient } from '@/lib/supabase/server'

function stripMarkdown(text) {
  return (text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\*(.*?)\*/g, '$1')
}

function safeName(title) {
  return (title || 'recipe').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_')
}

function buildPdf(recipe) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 })
    const chunks = []

    doc.on('data', c => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const W = doc.page.width   // 841.89
    const orange = '#D35400'
    const white = '#FFFFFF'
    const darkGray = '#333333'
    const lightGray = '#888888'

    // --- Orange header bar ---
    doc.rect(0, 0, W, 52).fill(orange)

    doc.fillColor(white).font('Helvetica-Bold').fontSize(22)
    doc.text((recipe.title || 'Recipe').toUpperCase(), 20, 14, {
      width: W - 40,
      align: 'center',
      lineBreak: false,
    })

    // --- Meta line ---
    doc.moveDown()
    const meta = [
      recipe.category ? `@${recipe.category}` : null,
      recipe.created_at
        ? new Date(recipe.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null,
    ].filter(Boolean).join('  ·  ')

    doc.fillColor(lightGray).font('Helvetica-Oblique').fontSize(9)
    doc.text(meta, 20, 58, { width: W - 40 })

    if (recipe.source_url) {
      doc.fillColor(lightGray).font('Helvetica-Oblique').fontSize(8)
        .text(recipe.source_url, 20, doc.y + 2, { width: W - 40, lineBreak: false })
    }

    // --- Divider ---
    doc.moveTo(20, 80).lineTo(W - 20, 80).strokeColor('#DDDDDD').lineWidth(0.5).stroke()

    // --- Recipe body ---
    doc.fillColor(darkGray).font('Courier').fontSize(10)
    const body = stripMarkdown(recipe.instructions_markdown || '')
    doc.text(body, 20, 90, {
      width: W - 40,
      lineGap: 2,
      paragraphGap: 4,
    })

    doc.end()
  })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return new Response('Missing id', { status: 400 })

  const supabase = createServerClient()
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('title, category, source_url, instructions_markdown, created_at')
    .eq('id', id)
    .single()

  if (error || !recipe) return new Response('Recipe not found', { status: 404 })

  const pdfBuffer = await buildPdf(recipe)
  const filename = `${safeName(recipe.title)}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
