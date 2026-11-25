import { beforeAll, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { AI_PRIVACY_PYTHON } from '../src/constants/env';
import { extractLocalFileText, MAX_LOCAL_FILE_BYTES } from '../src/ai/local-privacy-processor';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
let fixtures: Record<string, string>;

// Real in-memory documents exercise the installed parsers and Tesseract, not
// mocks or provider calls. Pillow's bundled font avoids a system-font dependency.
beforeAll(() => {
    const result = spawnSync(
        AI_PRIVACY_PYTHON,
        [
            '-c',
            String.raw`
import base64, io, json, zipfile
from PIL import Image, ImageDraw, ImageFont

fixtures = {}
def store(name, data):
    fixtures[name] = base64.b64encode(data).decode("ascii")

image = Image.new("RGB", (1200, 300), "white")
draw = ImageDraw.Draw(image)
font = ImageFont.load_default(size=48)
draw.text((40, 50), "PRIVATE LOCAL DOCUMENT", font=font, fill="black")
draw.text((40, 130), "Calculus course completed", font=font, fill="black")
for format in ("PNG", "JPEG", "WEBP", "PDF"):
    data = io.BytesIO()
    image.save(data, format=format)
    store(format.lower(), data.getvalue())

namespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
def document(body):
    return '<w:document xmlns:w="' + namespace + '"><w:body>' + body + '</w:body></w:document>'
def archive(name, parts):
    data = io.BytesIO()
    with zipfile.ZipFile(data, "w", compression=zipfile.ZIP_DEFLATED) as output:
        for path, contents in parts.items():
            output.writestr(path, contents)
    store(name, data.getvalue())

archive("docx", {
    "word/document.xml": document('<w:p><w:r><w:t>María García</w:t><w:tab/><w:t>Calculus</w:t><w:br/><w:t>Completed</w:t></w:r></w:p>'),
    "word/header1.xml": document('<w:p><w:r><w:t>Student record</w:t></w:r></w:p>'),
    "word/footer1.xml": document('<w:p><w:r><w:t>Page footer</w:t></w:r></w:p>'),
    "word/footnotes.xml": document('<w:p><w:r><w:t>Private footnote</w:t></w:r></w:p>'),
})
archive("unsafeDocx", {
    "word/document.xml": '<!DOCTYPE document [<!ENTITY private "DO NOT EXPAND">]>' + document('<w:p><w:r><w:t>&private;</w:t></w:r></w:p>'),
})

# Minimal text-layer PDF: no OCR is required for this page.
content = b"BT /F1 18 Tf 40 700 Td (Student completed Calculus with distinction.) Tj ET"
objects = [
    b"<< /Type /Catalog /Pages 2 0 R >>",
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"\nendstream",
]
pdf = bytearray(b"%PDF-1.4\n")
offsets = [0]
for number, body in enumerate(objects, 1):
    offsets.append(len(pdf))
    pdf.extend(str(number).encode() + b" 0 obj\n" + body + b"\nendobj\n")
xref = len(pdf)
pdf.extend(b"xref\n0 6\n0000000000 65535 f \n")
for offset in offsets[1:]:
    pdf.extend(f"{offset:010d} 00000 n \n".encode())
pdf.extend(b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + str(xref).encode() + b"\n%%EOF\n")
store("textPdf", pdf)
print(json.dumps(fixtures))
`,
        ],
        { encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024 }
    );
    if (result.error || result.status !== 0) {
        throw new Error('Local extraction fixture generation failed');
    }
    fixtures = JSON.parse(result.stdout);
});

test('plain UTF-8 extraction preserves Unicode and whitespace', async () => {
    const text = 'María García\tمحمد أحمد\n张伟 🎓\n';
    expect(await extractLocalFileText('text/plain', Buffer.from(text).toString('base64'))).toBe(
        text
    );
}, 30_000);

test('DOCX preserves paragraphs, tabs, breaks, and auxiliary text parts', async () => {
    expect(await extractLocalFileText(DOCX, fixtures.docx!)).toBe(
        'María García\tCalculus\nCompleted\nPage footer\nPrivate footnote\nStudent record'
    );
}, 30_000);

test('PDF text layer remains usable evidence', async () => {
    expect(await extractLocalFileText('application/pdf', fixtures.textPdf!)).toBe(
        'Student completed Calculus with distinction.'
    );
}, 30_000);

test('local OCR extracts PNG, JPEG, WebP, and scanned PDF without remote services', async () => {
    for (const [format, mime] of [
        ['png', 'image/png'],
        ['jpeg', 'image/jpeg'],
        ['webp', 'image/webp'],
        ['pdf', 'application/pdf'],
    ] as const) {
        const text = await extractLocalFileText(mime, fixtures[format]!);
        expect(text).toContain('PRIVATE LOCAL DOCUMENT');
        expect(text).toContain('Calculus course completed');
    }
}, 180_000);

test('malformed files and XML entities fail closed while subsequent requests work', async () => {
    for (const [mime, data] of [
        ['text/plain', '/w=='],
        ['application/pdf', Buffer.from('not a PDF').toString('base64')],
        ['image/jpeg', fixtures.png!],
        [DOCX, fixtures.unsafeDocx!],
        ['application/octet-stream', 'YQ=='],
        ['text/plain', 'invalid-base64'],
    ]) {
        await expect(extractLocalFileText(mime!, data!)).rejects.toThrow();
    }
    expect(await extractLocalFileText('text/plain', 'T0s=')).toBe('OK');
}, 30_000);

test('file and extracted-text capacity limits reject rather than truncate', async () => {
    await expect(
        extractLocalFileText(
            'text/plain',
            Buffer.alloc(MAX_LOCAL_FILE_BYTES + 1, 65).toString('base64')
        )
    ).rejects.toThrow();
    await expect(
        extractLocalFileText('text/plain', Buffer.from('A'.repeat(200_001)).toString('base64'))
    ).rejects.toThrow();
    // UTF-16 accounting matters even below the Python codepoint limit.
    await expect(
        extractLocalFileText('text/plain', Buffer.from('🎓'.repeat(100_001)).toString('base64'))
    ).rejects.toThrow();
}, 30_000);
