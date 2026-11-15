import sys, time, os, shutil
from playwright.sync_api import sync_playwright
URL, OUT = sys.argv[1], sys.argv[2]
GPU = os.environ.get('GPU_ARGS', '--use-angle=swiftshader --enable-unsafe-swiftshader').split()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome-stable', headless=True, args=GPU)
    ctx = b.new_context(viewport={'width': 960, 'height': 600}, record_video_dir=OUT, record_video_size={'width': 960, 'height': 600})
    pg = ctx.new_page(); pg.goto(URL + '?seed=42')
    while not pg.evaluate("window.__duck && window.__duck.state().state==='title'"): time.sleep(0.2)
    time.sleep(2.5); pg.click('#startBtn'); pg.evaluate('__duck.setAutopilot(true)')
    while pg.evaluate("__duck.state().state") == 'play': time.sleep(0.2)
    time.sleep(3.5); v = pg.video.path(); ctx.close(); b.close()
    shutil.move(v, os.path.join(OUT, 'clip.webm'))
