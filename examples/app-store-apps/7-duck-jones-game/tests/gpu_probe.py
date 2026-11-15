import sys, time, os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    for args in (['--enable-gpu','--ignore-gpu-blocklist','--use-angle=vulkan','--enable-features=Vulkan'], ['--enable-gpu','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=gl-egl'], ['--ignore-gpu-blocklist']):
        try:
            b = p.chromium.launch(executable_path='/usr/bin/google-chrome-stable', headless=True, args=args)
            pg = b.new_page(viewport={'width':1280,'height':800}); pg.goto(sys.argv[1]); time.sleep(3)
            r = pg.evaluate("(()=>{const g=document.createElement('canvas').getContext('webgl2');const e=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(e.UNMASKED_RENDERER_WEBGL)})()")
            pg.click('#startBtn'); time.sleep(4); print(args, r, pg.evaluate('__duck.state().fps')); b.close()
        except Exception as e: print(args, 'ERR', str(e)[:200])
