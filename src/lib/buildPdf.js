import PDFDocument from 'pdfkit'

export function safeName(title) {
  return (title || 'recipe').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_')
}

// Parse markdown into typed segments for rendering
function parseMarkdown(text) {
  const lines = (text || '').split('\n')
  const segments = []
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      segments.push({ type: 'list', items: [...listItems] })
      listItems = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (/^##\s/.test(line)) {
      flushList()
      segments.push({ type: 'h2', text: line.replace(/^##\s+/, '') })
    } else if (/^###\s/.test(line)) {
      flushList()
      segments.push({ type: 'h3', text: line.replace(/^###\s+/, '') })
    } else if (/^#\s/.test(line)) {
      flushList()
      // Skip top-level title — already in the orange header
    } else if (/^[-*]\s/.test(line)) {
      listItems.push(line.replace(/^[-*]\s+/, ''))
    } else if (/^\d+\.\s/.test(line)) {
      flushList()
      segments.push({ type: 'numbered', text: line })
    } else if (line.trim() === '' || line.trim() === '---') {
      flushList()
      segments.push({ type: 'spacer' })
    } else {
      flushList()
      // Strip inline markdown
      const plain = line
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
      if (plain.trim()) segments.push({ type: 'para', text: plain })
    }
  }
  flushList()
  return segments
}

const ORANGE  = '#D35400'
const WHITE   = '#FFFFFF'
const DARK    = '#1A1A1A'
const MID     = '#444444'
const LIGHT   = '#888888'
const RULE    = '#E8E8E8'

const HEADER_H = 56
const MARGIN   = 36
const LINE_GAP = 3

function needsNewPage(doc) {
  return doc.y > doc.page.height - doc.page.margins.bottom - 48
}

function continuationHeader(doc) {
  const W = doc.page.width
  doc.rect(0, 0, W, 6).fill(ORANGE)
  doc.y = 18
}

export function buildPdf(recipe) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margins: { top: HEADER_H + 16, bottom: 40, left: MARGIN, right: MARGIN },
    })
    const chunks = []
    doc.on('data', c => chunks.push(c))
    doc.on('end',  () => resolve(new Uint8Array(Buffer.concat(chunks))))
    doc.on('error', reject)

    const W = doc.page.width
    const contentW = W - MARGIN * 2

    // ── Page 1 orange header ──────────────────────────────────────────────────
    doc.rect(0, 0, W, HEADER_H).fill(ORANGE)

    // Title
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(18)
    const titleText = (recipe.title || 'Recipe').toUpperCase()
    doc.text(titleText, MARGIN, 12, { width: contentW, align: 'left', lineBreak: true })

    // Meta line
    const meta = [
      recipe.category ? `@${recipe.category}` : null,
      recipe.created_at
        ? new Date(recipe.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null,
      recipe.source_url || null,
    ].filter(Boolean).join('  ·  ')

    if (meta) {
      doc.fillColor('rgba(255,255,255,0.75)').font('Helvetica-Oblique').fontSize(8)
      doc.text(meta, MARGIN, HEADER_H - 16, { width: contentW, lineBreak: false, ellipsis: true })
    }

    // Divider
    doc.moveTo(MARGIN, HEADER_H + 8).lineTo(W - MARGIN, HEADER_H + 8)
      .strokeColor(RULE).lineWidth(0.5).stroke()

    // Reset position below header
    doc.y = HEADER_H + 18

    // ── Render body ───────────────────────────────────────────────────────────
    const segments = parseMarkdown(recipe.instructions_markdown || '')

    for (const seg of segments) {
      if (needsNewPage(doc)) {
        doc.addPage()
        continuationHeader(doc)
      }

      switch (seg.type) {
        case 'h2':
          doc.moveDown(0.4)
          doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(13)
          doc.text(seg.text.toUpperCase(), { width: contentW, lineGap: LINE_GAP })
          doc.moveTo(doc.x, doc.y).lineTo(doc.x + contentW, doc.y)
            .strokeColor(RULE).lineWidth(0.4).stroke()
          doc.moveDown(0.3)
          break

        case 'h3':
          doc.moveDown(0.3)
          doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
          doc.text(seg.text, { width: contentW, lineGap: LINE_GAP })
          doc.moveDown(0.2)
          break

        case 'numbered':
          doc.fillColor(MID).font('Helvetica').fontSize(10)
          doc.text(seg.text, { width: contentW, lineGap: LINE_GAP, indent: 4 })
          break

        case 'list':
          for (const item of seg.items) {
            if (needsNewPage(doc)) { doc.addPage(); continuationHeader(doc) }
            doc.fillColor(MID).font('Helvetica').fontSize(10)
            doc.text(`• ${item}`, { width: contentW - 12, lineGap: LINE_GAP, indent: 8 })
          }
          doc.moveDown(0.2)
          break

        case 'para':
          doc.fillColor(DARK).font('Helvetica').fontSize(10)
          doc.text(seg.text, { width: contentW, lineGap: LINE_GAP, paragraphGap: 3 })
          break

        case 'spacer':
          doc.moveDown(0.35)
          break
      }
    }

    // Footer on each page
    const pageCount = doc.bufferedPageRange().count
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i)
      doc.fillColor(LIGHT).font('Helvetica-Oblique').fontSize(7)
      doc.text(
        `SousChef  ·  ${recipe.title || 'Recipe'}  ·  Page ${i + 1} of ${pageCount}`,
        MARGIN,
        doc.page.height - 24,
        { width: contentW, align: 'center' }
      )
    }

    doc.end()
  })
}
