import json, os

TRANSLATIONS = {
    'launchpad.detail.back': {
        'es': 'Volver', 'de': 'Zurück', 'fr': 'Retour',
        'ar': 'رجوع', 'ko': '뒤로'
    },
    'launchpad.detail.whyUseThisApp': {
        'es': '¿Por qué usar esta app?', 'de': 'Warum diese App nutzen?', 'fr': "Pourquoi utiliser cette application ?",
        'ar': 'لماذا استخدام هذا التطبيق؟', 'ko': '이 앱을 사용하는 이유'
    },
    'launchpad.detail.privacyPolicy': {
        'es': 'Política de privacidad', 'de': 'Datenschutzrichtlinie', 'fr': 'Politique de confidentialité',
        'ar': 'سياسة الخصوصية', 'ko': '개인정보 처리방침'
    },
    'launchpad.detail.termsOfService': {
        'es': 'Términos de servicio', 'de': 'Nutzungsbedingungen', 'fr': "Conditions d'utilisation",
        'ar': 'شروط الخدمة', 'ko': '서비스 약관'
    },
    'launchpad.detail.category': {
        'es': 'Categoría', 'de': 'Kategorie', 'fr': 'Catégorie',
        'ar': 'الفئة', 'ko': '카테고리'
    },
}

def set_nested(d, dotted_key, value):
    parts = dotted_key.split('.')
    for p in parts[:-1]:
        d = d.setdefault(p, {})
    d[parts[-1]] = value

BASE = 'public/locales'
for locale in ['es', 'de', 'fr', 'ar', 'ko']:
    path = os.path.join(BASE, locale, 'translation.json')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for key, translations in TRANSLATIONS.items():
        if locale in translations:
            set_nested(data, key, translations[locale])
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        f.write('\n')
    print(f'Updated {locale}')
