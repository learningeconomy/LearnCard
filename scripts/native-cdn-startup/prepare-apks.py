"""Prepare private APK copies; never touch the source APK or any account data."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--apk', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--build-tools', required=True)
args = parser.parse_args()
source, output, tools = Path(args.apk).resolve(), Path(args.output).resolve(), Path(args.build_tools)
output.mkdir(mode=0o700)
badging = subprocess.check_output([str(tools / 'aapt2'), 'dump', 'badging', str(source)], text=True)
if "package: name='com.learncard.app.dctest'" not in badging:
    raise SystemExit('Only the isolated LearnCard .dctest APK is accepted')

CDN = 'https://cdn.jsdelivr.net/npm/jeep-sqlite@2.5.8/dist/jeep-sqlite/jeep-sqlite.esm.js'
bootstrap = r'''<script>
(() => {
 const p = window.__nativeCdnAB = {start:performance.now(), epoch:Date.now(), online:navigator.onLine, sql:[], cdn:null};
 document.addEventListener('DOMContentLoaded',()=>p.dcl=performance.now(),{once:true});
 window.addEventListener('load',()=>p.load=performance.now(),{once:true});
 const observer = new MutationObserver(() => {
   const root=document.getElementById('root');
   if(root?.childElementCount && !p.reactDom) {
     p.reactDom=performance.now(); requestAnimationFrame(()=>p.reactFrame=performance.now());
   }
   if(!p.interactive && root && [...root.querySelectorAll('button,input,a[href]')].some(e=>e.getBoundingClientRect().width>0)) p.interactive=performance.now();
   if(p.reactFrame && p.interactive) observer.disconnect();
 });
 observer.observe(document,{subtree:true,childList:true});
 setTimeout(()=>observer.disconnect(),60000);
 const install=()=>{
   const c=window.Capacitor;
   if(typeof c?.nativePromise!=='function') return false;
   const original=c.nativePromise;
   c.nativePromise=function(plugin,method,...args){
     const started=performance.now();
     const record=ok=>{if(plugin==='CapacitorSQLite' && p.sql.length<100)p.sql.push({method,start:started,end:performance.now(),ok});};
     try{return original.call(this,plugin,method,...args).then(v=>{record(true);return v},e=>{record(false);throw e})}
     catch(e){record(false);throw e}
   };
   p.bridge=performance.now();return true;
 };
 if(!install()){const timer=setInterval(()=>{if(install())clearInterval(timer)},5);setTimeout(()=>clearInterval(timer),5000);}
})();
</script>'''

key = output / 'probe.jks'
subprocess.run(['keytool', '-genkeypair', '-noprompt', '-keystore', str(key), '-storepass', 'android',
                '-keypass', 'android', '-alias', 'probe', '-dname', 'CN=Disposable CDN Startup Probe',
                '-keyalg', 'RSA', '-validity', '2'], check=True, capture_output=True)
with zipfile.ZipFile(source) as original:
    config = json.loads(original.read('assets/capacitor.config.json'))
    if config.get('server', {}).get('url'):
        raise SystemExit('APK must contain bundled assets, not a live-server URL')
    if config.get('plugins', {}).get('CapacitorUpdater', {}).get('autoUpdate') is not False:
        raise SystemExit('Disable OTA updates before building the source probe APK')
    html = original.read('assets/public/index.html').decode()
    if CDN in html:
        raise SystemExit('Source must be the no-CDN baseline; do not silently alter other HTML')
    if not re.search(r'<script\b[^>]*type="module"[^>]*src="/assets/', html):
        raise SystemExit('Expected bundled application module')
    base = html.replace('<head>', '<head>\n' + bootstrap, 1)
    hashes = {}
    for variant in ['without', 'with']:
        content = base
        if variant == 'with':
            tag = '<script type="module" src="' + CDN + '" onload="window.__nativeCdnAB.cdn={ok:true,time:performance.now()}" onerror="window.__nativeCdnAB.cdn={ok:false,time:performance.now()}"></script>\n'
            content = re.sub(r'(?=<script\b[^>]*type="module"[^>]*src="/assets/)', lambda _: tag, base, count=1)
        unsigned, aligned, signed = [output / f'{variant}-{suffix}.apk' for suffix in ['unsigned', 'aligned', 'signed']]
        with zipfile.ZipFile(unsigned, 'w') as target:
            for item in original.infolist():
                if item.filename.startswith('META-INF/'):
                    continue
                data = content.encode() if item.filename == 'assets/public/index.html' else original.read(item)
                target.writestr(copy.copy(item), data)
        subprocess.run([str(tools/'zipalign'), '-P', '16', '-f', '4', str(unsigned), str(aligned)], check=True)
        subprocess.run([str(tools/'apksigner'), 'sign', '--ks', str(key), '--ks-pass', 'pass:android',
                        '--out', str(signed), str(aligned)], check=True)
        subprocess.run([str(tools/'apksigner'), 'verify', str(signed)], check=True)
        hashes[variant] = hashlib.sha256(signed.read_bytes()).hexdigest()
        unsigned.unlink()
        aligned.unlink()
with zipfile.ZipFile(output/'without-signed.apk') as a, zipfile.ZipFile(output/'with-signed.apk') as b:
    files = [n for n in a.namelist() if not n.startswith('META-INF/')]
    if set(files) != {n for n in b.namelist() if not n.startswith('META-INF/')}:
        raise SystemExit('APK file inventories differ')
    changed = [n for n in files if a.read(n) != b.read(n)]
    if changed != ['assets/public/index.html']:
        raise SystemExit(f'Unexpected APK content differences: {changed}')
audit = {'sourceApkSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'variants': hashes,
         'changedEntries': changed, 'unchangedEntries': len(files)-1,
         'package': 'com.learncard.app.dctest', 'bundled': True, 'otaDisabled': True,
         'cdnUrl': CDN, 'sourceEntrySha256': hashlib.sha256(html.encode()).hexdigest()}
(output/'apk-audit.json').write_text(json.dumps(audit, indent=2)+'\n')
print(json.dumps(audit))
