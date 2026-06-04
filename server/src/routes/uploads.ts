import { Router, type ErrorRequestHandler } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { requireAdmin } from '../lib/auth.js';

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_MB = Number(process.env.MAX_UPLOAD_MB || 10);

await fs.mkdir(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\//i.test(file.mimetype)) {
      cb(new Error('仅支持图片文件')); return;
    }
    cb(null, true);
  }
});

router.post('/', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: '未选择文件' }); return; }
  const id = randomBytes(8).toString('hex');
  const baseName = `${Date.now()}-${id}`;
  try {
    const img = sharp(req.file.buffer, { failOn: 'truncated' }).rotate();
    const meta = await img.metadata();

    // Generate up to 3 sizes; smaller than 600 → only original
    const variants: Array<{ suffix: string; width: number }> = [];
    if ((meta.width || 0) > 1200) variants.push({ suffix: '-lg', width: 1200 });
    if ((meta.width || 0) > 600)  variants.push({ suffix: '-md', width: 600 });
    variants.push({ suffix: '',   width: Math.min(meta.width || 1200, 2000) });

    const outputs: string[] = [];
    for (const v of variants) {
      const fileName = `${baseName}${v.suffix}.webp`;
      const fullPath = path.join(UPLOAD_DIR, fileName);
      await img.clone().resize({ width: v.width, withoutEnlargement: true }).webp({ quality: 86 }).toFile(fullPath);
      outputs.push(fileName);
    }
    // The original-size (no suffix) is the canonical url
    const canonical = outputs[outputs.length - 1];
    res.status(201).json({
      url: `/uploads/${canonical}`,
      variants: outputs.map((n) => `/uploads/${n}`),
      width: meta.width,
      height: meta.height
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : '图片处理失败' });
  }
});

router.delete('/:filename', requireAdmin, async (req, res) => {
  const safe = path.basename(req.params.filename);
  // Delete all variants with the same base name
  const base = safe.replace(/(-lg|-md)?\.webp$/, '');
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    await Promise.all(files
      .filter((f) => f.startsWith(base))
      .map((f) => fs.unlink(path.join(UPLOAD_DIR, f)).catch(() => null))
    );
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

const uploadErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? `图片不能超过 ${MAX_FILE_MB}MB` : err.message });
    return;
  }
  if (err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
};

router.use(uploadErrorHandler);

export default router;
