"""Private local extraction worker. Never log input or parser errors."""
import base64
from contextlib import closing
import io
import json
import logging
import math
import os
import re
import resource
import signal
import subprocess
import sys
import warnings
import zipfile

# Keep protocol stdout separate from native/library diagnostics (including C code).
PROTOCOL = os.fdopen(os.dup(sys.stdout.fileno()), "w", encoding="utf-8", buffering=1)
NULL = open(os.devnull, "w")
os.dup2(NULL.fileno(), sys.stdout.fileno())
os.dup2(NULL.fileno(), sys.stderr.fileno())
logging.disable(logging.CRITICAL)
warnings.filterwarnings("ignore")
resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
resource.setrlimit(resource.RLIMIT_FSIZE, (64 * 1024 * 1024, 64 * 1024 * 1024))
# Bound parser allocations; deployment must also reserve physical RAM.
resource.setrlimit(resource.RLIMIT_AS, (8 * 1024**3, 8 * 1024**3))

from defusedxml import ElementTree
from PIL import Image, ImageOps
import pypdfium2 as pdfium

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_FRAME_BYTES = 15 * 1024 * 1024
MAX_TEXT = 200_000
MAX_PAGES = 50
MAX_SOURCE_PIXELS = 32_000_000
MAX_RENDER_PIXELS = 8_000_000
MAX_DIMENSION = 3000
Image.MAX_IMAGE_PIXELS = MAX_SOURCE_PIXELS


def alarm_expired(_signal, _frame):
    raise TimeoutError("processing deadline")


def bounded_text(text):
    if len(text) > MAX_TEXT or len(text.encode("utf-16-le")) // 2 > MAX_TEXT:
        raise ValueError("text limit")
    return text


def fit_image(image):
    width, height = image.size
    if width <= 0 or height <= 0 or width * height > MAX_SOURCE_PIXELS:
        raise ValueError("image dimensions")
    scale = min(1.0, MAX_DIMENSION / max(width, height), math.sqrt(MAX_RENDER_PIXELS / (width * height)))
    image = ImageOps.exif_transpose(image)
    if scale < 1:
        image.thumbnail((max(1, int(width * scale)), max(1, int(height * scale))), Image.Resampling.LANCZOS)
    if image.mode in ("RGBA", "LA") or "transparency" in image.info:
        rgba = image.convert("RGBA")
        background = Image.new("RGBA", rgba.size, "white")
        background.alpha_composite(rgba)
        return background.convert("RGB")
    return image.convert("RGB")


def ocr(image):
    # Pipes only: no user data ever reaches a temporary filesystem path.
    with fit_image(image) as prepared:
        encoded = io.BytesIO()
        prepared.save(encoded, format="PNG")
        if encoded.tell() > 32 * 1024 * 1024:
            raise ValueError("render limit")
        result = subprocess.run(
            ["tesseract", "stdin", "stdout", "-l", OCR_LANGUAGES, "--psm", "3"],
            input=encoded.getvalue(), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            check=True, timeout=30,
        )
    return bounded_text(result.stdout.decode("utf-8", errors="strict").strip())


def extract_pdf(data):
    output = []
    total = 0
    with closing(pdfium.PdfDocument(data)) as document:
        if not 0 < len(document) <= MAX_PAGES:
            raise ValueError("page limit")
        for index in range(len(document)):
            with closing(document[index]) as page:
                with closing(page.get_textpage()) as text_page:
                    if text_page.count_chars() > MAX_TEXT:
                        raise ValueError("text limit")
                    text = text_page.get_text_bounded().strip()
                # OCR mixed pages too: a small text header must not hide a scan.
                has_images = False
                source_pixels = 0
                for count, obj in enumerate(page.get_objects()):
                    if count >= 10_000:
                        raise ValueError("page object limit")
                    if obj.type == pdfium.raw.FPDF_PAGEOBJ_IMAGE:
                        has_images = True
                        width, height = obj.get_size()
                        source_pixels += width * height
                        if width <= 0 or height <= 0 or source_pixels > MAX_SOURCE_PIXELS:
                            raise ValueError("page image dimensions")
                if len("".join(text.split())) <= 20 or has_images:
                    width, height = page.get_size()
                    if not all(math.isfinite(value) and value > 0 for value in (width, height)):
                        raise ValueError("page dimensions")
                    scale = min(200 / 72, MAX_DIMENSION / max(width, height), math.sqrt(MAX_RENDER_PIXELS / (width * height)))
                    with closing(page.render(scale=scale)) as bitmap:
                        with bitmap.to_pil() as image:
                            recognized = ocr(image)
                    if recognized:
                        # Preserve the text layer, including text OCR may miss;
                        # avoid duplication when the whole page is text-equivalent.
                        if not text or "".join(text.split()) == "".join(recognized.split()):
                            text = recognized
                        else:
                            text = text + "\n" + recognized
                total += len(text) + 2
                if total > MAX_TEXT:
                    raise ValueError("text limit")
                output.append(text)
    return bounded_text("\n\n".join(output))


def extract_docx(data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) > 2000 or sum(item.file_size for item in entries) > 50 * 1024 * 1024:
            raise ValueError("archive limit")
        if len({item.filename for item in entries}) != len(entries):
            raise ValueError("ambiguous archive")
        selected = ["word/document.xml"]
        selected += sorted(item.filename for item in entries if re.fullmatch(r"word/(?:header\d+|footer\d+|footnotes|endnotes)\.xml", item.filename))
        paragraphs = []
        total = 0
        namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
        for name in selected:
            if archive.getinfo(name).file_size > 8 * 1024 * 1024:
                raise ValueError("xml limit")
            root = ElementTree.fromstring(archive.read(name))
            for paragraph in root.iter(namespace + "p"):
                pieces = []
                for node in paragraph.iter():
                    if node.tag == namespace + "t":
                        pieces.append(node.text or "")
                    elif node.tag == namespace + "tab":
                        pieces.append("\t")
                    elif node.tag in (namespace + "br", namespace + "cr"):
                        pieces.append("\n")
                text = "".join(pieces)
                total += len(text) + 1
                if total > MAX_TEXT:
                    raise ValueError("text limit")
                paragraphs.append(text)
        return bounded_text("\n".join(paragraphs))


def extract(request):
    encoded = request["base64"]
    if not isinstance(encoded, str) or len(encoded) > ((MAX_FILE_BYTES + 2) // 3) * 4:
        raise ValueError("file limit")
    data = base64.b64decode(encoded, validate=True)
    if not data or len(data) > MAX_FILE_BYTES:
        raise ValueError("file limit")
    mime = request["mimeType"]
    if mime == "text/plain":
        return bounded_text(data.decode("utf-8", errors="strict"))
    if mime == "application/pdf":
        return extract_pdf(data)
    if mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return extract_docx(data)
    formats = {"image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WEBP"}
    if mime not in formats:
        raise ValueError("unsupported format")
    with Image.open(io.BytesIO(data)) as image:
        frames = getattr(image, "n_frames", 1)
        if image.format != formats[mime] or not 0 < frames <= MAX_PAGES:
            raise ValueError("image format")
        output = []
        total = 0
        for frame in range(frames):
            image.seek(frame)
            text = ocr(image)
            if not output or text != output[-1]:
                total += len(text) + 2
                if total > MAX_TEXT:
                    raise ValueError("text limit")
                output.append(text)
        return bounded_text("\n\n".join(output))




def send(value):
    frame = json.dumps(value, ensure_ascii=True, separators=(",", ":"))
    if len(frame) > 2 * 1024 * 1024 - 1:
        raise ValueError("response limit")
    PROTOCOL.write(frame + "\n")
    PROTOCOL.flush()


try:
    signal.signal(signal.SIGALRM, alarm_expired)
    signal.alarm(110)
    OCR_LANGUAGES = os.environ["AI_PRIVACY_OCR_LANGUAGES"]
    if not re.fullmatch(r"[a-zA-Z0-9_]+(?:\+[a-zA-Z0-9_]+)*", OCR_LANGUAGES):
        raise ValueError("invalid language configuration")
    installed = subprocess.run(["tesseract", "--list-langs"], check=True, capture_output=True, timeout=10).stdout.decode().splitlines()[1:]
    if not set(OCR_LANGUAGES.split("+")).issubset(set(installed)):
        raise ValueError("missing OCR language")
    signal.alarm(0)
    send({"ready": True})
    while True:
        line = sys.stdin.buffer.readline(MAX_FRAME_BYTES + 1)
        if not line:
            break
        if len(line) > MAX_FRAME_BYTES or not line.endswith(b"\n"):
            break
        request = None
        try:
            request = json.loads(line)
            if not isinstance(request, dict) or not isinstance(request.get("id"), int):
                break
            signal.alarm(170)
            if request.get("op") == "extract":
                result = extract(request)
            else:
                raise ValueError("operation")
            send({"id": request["id"], "ok": True, "result": result})
        except Exception:
            if isinstance(request, dict) and isinstance(request.get("id"), int):
                send({"id": request["id"], "ok": False})
            else:
                break
        finally:
            signal.alarm(0)
            request = None
            line = b""
            result = None
except Exception:
    # Initialization/framing failure closes the pipe: the backend rejects all
    # affected requests, with no exception message that could contain raw input.
    sys.exit(1)
