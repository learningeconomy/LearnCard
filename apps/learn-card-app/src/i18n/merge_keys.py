#!/usr/bin/env python3
"""Merge i18n keys into all 6 locale JSON files.
Usage: python3 merge_keys.py <keys_json>
Where keys_json is a flat dotted-path → value dict for EN.
Non-EN values are auto-translated later; for now they get the EN value as placeholder.
"""
import json, sys, os

LOCALES = ['en', 'es', 'de', 'fr', 'ar', 'ko']
BASE = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'locales')

def set_nested(d, dotted_key, value):
    parts = dotted_key.split('.')
    for p in parts[:-1]:
        d = d.setdefault(p, {})
    d[parts[-1]] = value

def main():
    if len(sys.argv) < 2:
        print("Usage: merge_keys.py '<json_string>'")
        sys.exit(1)
    
    new_keys = json.loads(sys.argv[1])
    
    for locale in LOCALES:
        path = os.path.join(BASE, locale, 'translation.json')
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for dotted_key, en_value in new_keys.items():
            if locale == 'en':
                set_nested(data, dotted_key, en_value)
            else:
                # Check if key already has a translation; if not, use EN as placeholder
                parts = dotted_key.split('.')
                obj = data
                exists = True
                for p in parts[:-1]:
                    if p not in obj or not isinstance(obj[p], dict):
                        exists = False
                        break
                    obj = obj[p]
                if exists and parts[-1] in obj:
                    # Already translated — skip
                    continue
                else:
                    set_nested(data, dotted_key, en_value)
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
            f.write('\n')
        
        print(f'Updated {locale}')

if __name__ == '__main__':
    main()
