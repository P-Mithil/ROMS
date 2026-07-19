import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { BadRequestError } from "../../shared/errors/AppError.js";
import { requireNonEmptyText, truncateText } from "./openai.client.js";

export async function extractResumeTextFromFile(
  filePath: string,
  mimeType: string | null,
  originalName?: string | null,
): Promise<string> {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(absolute);
  } catch {
    throw new BadRequestError("Resume file not found on disk", "RESUME_REQUIRED");
  }

  const lowerName = (originalName ?? absolute).toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();

  if (
    mime.includes("pdf") ||
    lowerName.endsWith(".pdf")
  ) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return requireNonEmptyText(truncateText(result.text ?? ""));
    } finally {
      await parser.destroy();
    }
  }

  if (
    mime.includes("wordprocessingml") ||
    mime.includes("officedocument") ||
    lowerName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return requireNonEmptyText(truncateText(result.value ?? ""));
  }

  if (lowerName.endsWith(".doc") || mime === "application/msword") {
    throw new BadRequestError(
      "Legacy .doc files are not supported. Upload PDF or DOCX.",
      "RESUME_FORMAT_UNSUPPORTED",
    );
  }

  throw new BadRequestError(
    "Unsupported resume format. Upload PDF or DOCX.",
    "RESUME_FORMAT_UNSUPPORTED",
  );
}

export async function extractResumeTextFromUpload(
  file: Express.Multer.File,
): Promise<string> {
  const lowerName = file.originalname.toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (mime.includes("pdf") || lowerName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      return requireNonEmptyText(truncateText(result.text ?? ""));
    } finally {
      await parser.destroy();
    }
  }

  if (
    mime.includes("wordprocessingml") ||
    lowerName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return requireNonEmptyText(truncateText(result.value ?? ""));
  }

  if (lowerName.endsWith(".doc") || mime === "application/msword") {
    throw new BadRequestError(
      "Legacy .doc files are not supported. Upload PDF or DOCX.",
      "RESUME_FORMAT_UNSUPPORTED",
    );
  }

  throw new BadRequestError(
    "Unsupported resume format. Upload PDF or DOCX.",
    "RESUME_FORMAT_UNSUPPORTED",
  );
}
