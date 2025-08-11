import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type PdfLineItem = {
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
};

export type PdfDocumentData = {
  type: 'invoice' | 'quotation';
  docNumber: string;
  date: string; // yyyy-mm-dd
  customerDetails?: { name?: string; email?: string; address?: string };
  items: PdfLineItem[];
  subtotal: number;
  total: number;
};

export async function generateDocumentPdf(data: PdfDocumentData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 40;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let cursorY = height - margin;

  const drawText = (text: string, x: number, y: number, size = 12, bold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0, 0, 0),
    });
  };

  const title = data.type === 'invoice' ? 'Invoice' : 'Quotation';
  drawText(title, margin, cursorY, 22, true);
  if (data.docNumber) drawText(`# ${data.docNumber}`, margin + 140, cursorY + 2, 12);
  cursorY -= 24;

  drawText(`Date: ${data.date}`, margin, cursorY, 12);
  cursorY -= 24;

  if (data.customerDetails) {
    drawText('Bill To:', margin, cursorY, 12, true);
    cursorY -= 16;
    if (data.customerDetails.name) {
      drawText(String(data.customerDetails.name), margin, cursorY, 12);
      cursorY -= 14;
    }
    if (data.customerDetails.email) {
      drawText(String(data.customerDetails.email), margin, cursorY, 12);
      cursorY -= 14;
    }
    if (data.customerDetails.address) {
      const lines = String(data.customerDetails.address).split(/\r?\n/);
      for (const line of lines) {
        if (line.trim().length > 0) {
          drawText(line, margin, cursorY, 12);
          cursorY -= 14;
        }
      }
    }
    cursorY -= 8;
  }

  // Table headers
  const colX = {
    item: margin,
    unitPrice: width - margin - 200,
    qty: width - margin - 120,
    amount: width - margin - 60,
  } as const;

  drawText('Item', colX.item, cursorY, 12, true);
  drawText('Unit Price', colX.unitPrice, cursorY, 12, true);
  drawText('Qty', colX.qty, cursorY, 12, true);
  drawText('Amount', colX.amount, cursorY, 12, true);
  cursorY -= 18;

  for (const it of data.items) {
    if (cursorY < margin + 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      cursorY = page.getSize().height - margin;
    }
    drawText(it.name || '-', colX.item, cursorY, 12);
    drawText(it.unitPrice.toFixed(2), colX.unitPrice, cursorY, 12);
    drawText(String(it.quantity), colX.qty, cursorY, 12);
    drawText(it.amount.toFixed(2), colX.amount, cursorY, 12);
    cursorY -= 14;
    if (it.description) {
      const desc = it.description.length > 100 ? `${it.description.slice(0, 100)}…` : it.description;
      drawText(desc, colX.item, cursorY, 10);
      cursorY -= 12;
    }
  }

  cursorY -= 12;
  drawText('Subtotal:', colX.qty, cursorY, 12, true);
  drawText(data.subtotal.toFixed(2), colX.amount, cursorY, 12);
  cursorY -= 16;
  drawText('Total:', colX.qty, cursorY, 14, true);
  drawText(data.total.toFixed(2), colX.amount, cursorY, 14, true);

  return await pdfDoc.save();
}


