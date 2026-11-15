import json, sys, time, os, glob, shutil
from playwright.sync_api import sync_playwright
URL = sys.argv[1]; OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
GPU = os.environ.get('GPU_ARGS', '--use-angle=swiftshader --enable-unsafe-swiftshader').split()
results = {}

def watch(page, tag):
    errs = []
    page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error',) else None)
    page.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    return errs

def st(page): return page.evaluate('window.__duck && window.__duck.state()')
def wait_state(page, states, timeout):
    t0 = time.time()
    while time.time() - t0 < timeout:
        s = st(page)
        if s and s['state'] in states: return s
        time.sleep(0.25)
    raise RuntimeError(f'timeout waiting {states}; last={st(page)}')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome-stable', headless=True, args=GPU)
    # ---- desktop: title, autopilot play-through to the end, restart ----
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, record_video_dir=os.path.join(OUT, 'video'), record_video_size={'width': 960, 'height': 600})
    pg = ctx.new_page(); errs = watch(pg, 'desktop')
    pg.goto(URL + '?seed=42'); wait_state(pg, ['title'], 30); time.sleep(1.5)
    pg.screenshot(path=f'{OUT}/01-title-desktop.png')
    pg.click('#startBtn'); s = wait_state(pg, ['play'], 5)
    pg.keyboard.press('ArrowLeft'); time.sleep(0.2); lane_after_left = st(pg)['lane']
    pg.keyboard.press('Space'); time.sleep(0.1)
    pg.evaluate('window.__duck.setAutopilot(true)')
    time.sleep(4); pg.screenshot(path=f'{OUT}/02-gameplay-desktop.png')
    t0 = time.time()
    while st(pg)['coins'] < 1 and time.time() - t0 < 30: time.sleep(0.2)
    first_coin = st(pg)
    time.sleep(6)
    while st(pg)['invuln'] > 0: time.sleep(0.05)
    pg.screenshot(path=f'{OUT}/03-gameplay-desktop-2.png')
    end = wait_state(pg, ['won', 'lost'], 150); time.sleep(2.2)
    pg.screenshot(path=f'{OUT}/04-end-desktop.png')
    end_visible = pg.is_visible('#end')
    pg.click('#againBtn'); time.sleep(0.5); restart = st(pg)
    time.sleep(1); fps = st(pg)['fps']
    results['desktop'] = dict(lane_after_left=lane_after_left, first_coin=first_coin, end=end, end_screen_visible=end_visible,
                              restart_state=restart, fps=fps, errors=list(errs))
    # ---- desktop lose path: no input at all ----
    pg.evaluate('window.__duck.setAutopilot(false)')
    lose = wait_state(pg, ['won', 'lost'], 90); time.sleep(2.0)
    pg.screenshot(path=f'{OUT}/05-lose-desktop.png')
    pg.keyboard.press('Enter'); time.sleep(0.5)
    results['desktop_lose'] = dict(end=lose, restart_via_enter=st(pg)['state'], errors=list(errs))
    vid = pg.video.path(); ctx.close()
    shutil.move(vid, f'{OUT}/desktop-run.webm')

    # ---- mobile: touch emulation ----
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True,
                        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
    pg = ctx.new_page(); errs = watch(pg, 'mobile')
    pg.goto(URL + '?seed=7'); wait_state(pg, ['title'], 30); time.sleep(1.5)
    pg.screenshot(path=f'{OUT}/06-title-mobile.png')
    pg.tap('#startBtn'); wait_state(pg, ['play'], 5)
    touch_visible = pg.is_visible('#touch')
    pg.tap('#touch button[data-act="right"]'); time.sleep(0.2); lane_r = st(pg)['lane']
    pg.tap('#touch button[data-act="jump"]'); time.sleep(0.05); jumped = pg.evaluate('window.__duck.state().state')
    # swipe left on the canvas via CDP touch events
    cdp = ctx.new_cdp_session(pg)
    def swipe(x0, y0, x1, y1):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y0}]})
        for i in range(1, 6): cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * i / 5, 'y': y0 + (y1 - y0) * i / 5}]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    time.sleep(0.3); before = st(pg)['lane']; swipe(250, 450, 120, 455); time.sleep(0.2); lane_swipe = st(pg)['lane']
    pg.evaluate('window.__duck.setAutopilot(true)')
    time.sleep(5)
    while st(pg)['invuln'] > 0: time.sleep(0.05)
    pg.screenshot(path=f'{OUT}/07-gameplay-mobile.png')
    end = wait_state(pg, ['won', 'lost'], 150); time.sleep(2.2)
    pg.screenshot(path=f'{OUT}/08-end-mobile.png')
    pg.tap('#againBtn'); time.sleep(0.5)
    results['mobile'] = dict(touch_controls_visible=touch_visible, lane_after_right_button=lane_r, lane_before_swipe=before,
                             lane_after_swipe_left=lane_swipe, end=end, restart_state=st(pg)['state'], fps=st(pg)['fps'], errors=list(errs))
    ctx.close(); b.close()
print(json.dumps(results, indent=1))
