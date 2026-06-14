// pdf-parse deep import avoids the test/ directory issue in Next.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function extractTextFromPDF(
  buffer: Buffer
): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length < 50) {
      throw new Error("No readable text found in PDF");
    }
    // Clean extracted text
    const cleaned = data.text
      .replace(/\x00/g, "")
      .replace(/\f/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    console.log(`[PDF] Extracted ${cleaned.length} chars via pdf-parse`);
    return cleaned;
  } catch (err: any) {
    console.error("[PDF] Extraction failed:", err.message);
    throw new Error("PDF parsing failed: " + err.message);
  }
}
