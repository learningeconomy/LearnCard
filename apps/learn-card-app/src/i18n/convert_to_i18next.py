#!/usr/bin/env python3
"""Convert Paraglide m['key']() calls to i18next t('key', 'default') calls.
Also converts import * as m from '...paraglide/messages.js' to import { useTranslation } from 'react-i18next'
and adds const { t } = useTranslation() inside the component.
"""
import re, sys, os

# Map of i18n keys to English defaults (for the t() defaults parameter)
KEY_DEFAULTS = {}
import json
with open('/Users/donny/Work/LearnCard/apps/learn-card-app/public/locales/en/translation.json') as f:
    data = json.load(f)

def flatten(d, prefix=''):
    for k, v in d.items():
        if isinstance(v, dict):
            flatten(v, f'{prefix}{k}.')
        else:
            KEY_DEFAULTS[f'{prefix}{k}'] = v
flatten(data)

def convert_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Check if this file has paraglide import
    if "import * as m from" not in content and "m['" not in content and 'm["' not in content:
        return False
    
    # Replace paraglide import with i18next import
    content = re.sub(
        r"import \* as m from '[^']*paraglide/messages\.js';\n?",
        "import { useTranslation } from 'react-i18next';\n",
        content
    )
    
    # Replace m['key']({ var: val }) with t('key', 'default', { var: val })
    def replace_m_call(match):
        key = match.group(1)
        args = match.group(2) or ''
        default = KEY_DEFAULTS.get(key, key)
        # Escape single quotes in default
        default_escaped = default.replace("'", "\\'")
        if args:
            return f"t('{key}', '{default_escaped}', {args})"
        else:
            return f"t('{key}', '{default_escaped}')"
    
    content = re.sub(r"m\['([^']+)'\]\(([^)]*)\)", replace_m_call, content)
    # Also handle m["key"]() variant
    content = re.sub(r'm\["([^"]+)"\]\(([^)]*)\)', replace_m_call, content)
    
    # Add const { t } = useTranslation() if not present
    if 'useTranslation()' in content and 'const { t } = useTranslation()' not in content:
        # Find the first function component or const declaration
        # Insert after the first 'const' that's inside a component
        # Strategy: insert after first React.FC or = () => or = ( props
        # For simplicity, insert after the first import line
        lines = content.split('\n')
        insert_idx = None
        for i, line in enumerate(lines):
            if 'useTranslation' in line and 'import' in line:
                # Found the import line; insert const { t } after a few lines
                # Look for the component/function start
                for j in range(i+1, min(i+30, len(lines))):
                    if re.match(r'(const \w+.*=.*\(|export const \w+|function \w+|const \w+.*React\.FC)', lines[j]):
                        # Look for the first const inside the function body
                        for k in range(j, min(j+20, len(lines))):
                            if lines[k].strip().startswith('const ') and 'useTranslation' not in lines[k]:
                                insert_idx = k
                                break
                        break
                break
        
        if insert_idx:
            lines.insert(insert_idx, "    const { t } = useTranslation();")
            content = '\n'.join(lines)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: convert_to_i18next.py <file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    if convert_file(filepath):
        print(f"Converted: {filepath}")
    else:
        print(f"Skipped (no changes): {filepath}")
