#!/usr/bin/env python3
"""Fill non-EN translations for the new i18n keys.
Writes proper translations for es/de/fr/ar/ko based on known translations.
"""
import json, os

BASE = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'locales')

# Comprehensive translation map for the new keys
TRANSLATIONS = {
    # Launchpad actions
    "launchpad.actions.addToLearnCard": {
        "es": "Agregar a LearnCard", "de": "Zu LearnCard hinzufügen", "fr": "Ajouter à LearnCard",
        "ar": "إضافة إلى LearnCard", "ko": "LearnCard에 추가"
    },
    "launchpad.actions.buildMyLearnCard": {
        "es": "Construir Mi LearnCard", "de": "Mein LearnCard aufbauen", "fr": "Construire Mon LearnCard",
        "ar": "بناء LearnCard الخاص بي", "ko": "나의 LearnCard 만들기"
    },
    "launchpad.actions.newAiTutoringSession": {
        "es": "Nueva sesión de tutoría IA", "de": "Neue KI-Tutoring-Sitzung", "fr": "Nouvelle session de tutorat IA",
        "ar": "جلسة تعليم ذكاء اصطناعي جديدة", "ko": "새 AI 튜터링 세션"
    },
    "launchpad.actions.understandMySkills": {
        "es": "Entender mis habilidades", "de": "Meine Fähigkeiten verstehen", "fr": "Comprendre mes compétences",
        "ar": "فهم مهاراتي", "ko": "내 기술 이해하기"
    },
    "launchpad.actions.customizeAiSessions": {
        "es": "Personalizar sesiones de IA", "de": "KI-Sitzungen anpassen", "fr": "Personnaliser les sessions IA",
        "ar": "تخصيص جلسات الذكاء الاصطناعي", "ko": "AI 세션 맞춤 설정"
    },
    "launchpad.actions.shareInsightsWithTeacher": {
        "es": "Compartir información con el profesor", "de": "Einblicke mit Lehrer teilen", "fr": "Partager les analyses avec l'enseignant",
        "ar": "مشاركة الرؤى مع المعلم", "ko": "교사와 인사이트 공유"
    },
    "launchpad.actions.viewLearnerInsights": {
        "es": "Ver información del estudiante", "de": "Lernereinblicke anzeigen", "fr": "Voir les analyses de l'apprenant",
        "ar": "عرض رؤى المتعلم", "ko": "학습자 인사이트 보기"
    },
    "launchpad.actions.requestLearnerInsights": {
        "es": "Solicitar información del estudiante", "de": "Lernereinblicke anfordern", "fr": "Demander les analyses de l'apprenant",
        "ar": "طلب رؤى المتعلم", "ko": "학습자 인사이트 요청"
    },
    "launchpad.actions.issueCredential": {
        "es": "Emitir credencial", "de": "Berechtigung ausstellen", "fr": "Émettre une accréditation",
        "ar": "إصدار بيانات اعتماد", "ko": "자격 증명 발급"
    },
    "launchpad.actions.createCredential": {
        "es": "Crear credencial", "de": "Berechtigung erstellen", "fr": "Créer une accréditation",
        "ar": "إنشاء بيانات اعتماد", "ko": "자격 증명 만들기"
    },
    "launchpad.actions.editSkillsFrameworks": {
        "es": "Editar marcos de habilidades", "de": "Fähigkeitsrahmen bearbeiten", "fr": "Modifier les cadres de compétences",
        "ar": "تعديل أطر المهارات", "ko": "기술 프레임워크 편집"
    },
    "launchpad.actions.manageSkillsFrameworks": {
        "es": "Gestionar marcos de habilidades", "de": "Fähigkeitsrahmen verwalten", "fr": "Gérer les cadres de compétences",
        "ar": "إدارة أطر المهارات", "ko": "기술 프레임워크 관리"
    },
    "launchpad.actions.createFamily": {
        "es": "Crear familia", "de": "Familie erstellen", "fr": "Créer une famille",
        "ar": "إنشاء عائلة", "ko": "가족 만들기"
    },
    "launchpad.actions.viewFamily": {
        "es": "Ver familia", "de": "Familie anzeigen", "fr": "Voir la famille",
        "ar": "عرض العائلة", "ko": "가족 보기"
    },
    "launchpad.actions.boostChild": {
        "es": "Impulsar a niño", "de": "Kind fördern", "fr": "Valoriser l'enfant",
        "ar": "تعزيز الطفل", "ko": "자녀 부스트"
    },
    "launchpad.actions.addChild": {
        "es": "Agregar niño", "de": "Kind hinzufügen", "fr": "Ajouter un enfant",
        "ar": "إضافة طفل", "ko": "자녀 추가"
    },
    "launchpad.actions.switchChild": {
        "es": "Cambiar niño", "de": "Kind wechseln", "fr": "Changer d'enfant",
        "ar": "تبديل الطفل", "ko": "자녀 전환"
    },
    "launchpad.actions.viewChildInsights": {
        "es": "Ver información del niño", "de": "Kindeinblicke anzeigen", "fr": "Voir les analyses de l'enfant",
        "ar": "عرض رؤى الطفل", "ko": "자녀 인사이트 보기"
    },
    "launchpad.actions.createApiToken": {
        "es": "Crear token de API", "de": "API-Token erstellen", "fr": "Créer un jeton API",
        "ar": "إنشاء رمز API", "ko": "API 토큰 만들기"
    },
    "launchpad.actions.createSigningAuthority": {
        "es": "Crear autoridad de firma", "de": "Signierautorität erstellen", "fr": "Créer une autorité de signature",
        "ar": "إنشاء سلطة التوقيع", "ko": "서명 기관 만들기"
    },
    "launchpad.actions.createConsentFlow": {
        "es": "Crear ConsentFlow", "de": "ConsentFlow erstellen", "fr": "Créer un ConsentFlow",
        "ar": "إنشاء ConsentFlow", "ko": "ConsentFlow 만들기"
    },
    "launchpad.actions.switchNetwork": {
        "es": "Cambiar red", "de": "Netzwerk wechseln", "fr": "Changer de réseau",
        "ar": "تبديل الشبكة", "ko": "네트워크 전환"
    },
    "launchpad.actions.readDocs": {
        "es": "Leer documentación", "de": "Dokumentation lesen", "fr": "Lire la documentation",
        "ar": "قراءة المستندات", "ko": "문서 읽기"
    },
    "launchpad.actions.importCredentials": {
        "es": "Importar credenciales", "de": "Berechtigungen importieren", "fr": "Importer des accréditations",
        "ar": "استيراد بيانات الاعتماد", "ko": "자격 증명 가져오기"
    },
    "launchpad.actions.createOrganization": {
        "es": "Crear organización", "de": "Organisation erstellen", "fr": "Créer une organisation",
        "ar": "إنشاء مؤسسة", "ko": "조직 만들기"
    },
    "launchpad.actions.switchAccount": {
        "es": "Cambiar cuenta", "de": "Konto wechseln", "fr": "Changer de compte",
        "ar": "تبديل الحساب", "ko": "계정 전환"
    },
    "launchpad.actions.claimCredential": {
        "es": "Reclamar credencial", "de": "Berechtigung beanspruchen", "fr": "Réclamer une accréditation",
        "ar": "المطالبة ببيانات الاعتماد", "ko": "자격 증명 수령"
    },
    # Launchpad modal
    "launchpad.modal.whatWouldYouLikeToDo": {
        "es": "¿Qué te gustaría hacer?", "de": "Was möchtest du tun?", "fr": "Que souhaitez-vous faire ?",
        "ar": "ماذا تريد أن تفعل؟", "ko": "무엇을 하시겠습니까?"
    },
    "launchpad.modal.roleUpdated": {
        "es": "Rol actualizado", "de": "Rolle aktualisiert", "fr": "Rôle mis à jour",
        "ar": "تم تحديث الدور", "ko": "역할 업데이트됨"
    },
    "launchpad.modal.nowRole": {
        "es": "Ahora eres {{role}}.", "de": "Du bist jetzt {{role}}.", "fr": "Vous êtes maintenant {{role}}.",
        "ar": "أنت الآن {{role}}.", "ko": "이제 {{role}}입니다."
    },
    "launchpad.modal.unableToUpdateRole": {
        "es": "No se pudo actualizar el rol", "de": "Rolle konnte nicht aktualisiert werden", "fr": "Impossible de mettre à jour le rôle",
        "ar": "تعذر تحديث الدور", "ko": "역할을 업데이트할 수 없습니다"
    },
    "launchpad.modal.unableToOpenRequestInsights": {
        "es": "No se pudo abrir Solicitar Información", "de": "Einblicke anfordern konnte nicht geöffnet werden", "fr": "Impossible d'ouvrir Demander des analyses",
        "ar": "تعذر فتح طلب الرؤى", "ko": "인사이트 요청을 열 수 없습니다"
    },
    "launchpad.passport": {
        "es": "Pasaporte", "de": "Pass", "fr": "Passeport",
        "ar": "جواز السفر", "ko": "패스포트"
    },
    "launchpad.launchpad": {
        "es": "Launchpad", "de": "Launchpad", "fr": "Launchpad",
        "ar": "منصة الإطلاق", "ko": "런치패드"
    },
    # App card
    "launchpad.appCard.open": {
        "es": "Abrir", "de": "Öffnen", "fr": "Ouvrir",
        "ar": "فتح", "ko": "열기"
    },
    "launchpad.appCard.get": {
        "es": "Obtener", "de": "Laden", "fr": "Obtenir",
        "ar": "الحصول", "ko": "설치"
    },
    "launchpad.appCard.launch": {
        "es": "Iniciar", "de": "Starten", "fr": "Lancer",
        "ar": "تشغيل", "ko": "실행"
    },
    "launchpad.appCard.soon": {
        "es": "Próximamente", "de": "Bald", "fr": "Bientôt",
        "ar": "قريباً", "ko": "곧"
    },
    "launchpad.appCard.connect": {
        "es": "Conectar", "de": "Verbinden", "fr": "Connecter",
        "ar": "اتصال", "ko": "연결"
    },
    "launchpad.appCard.loading": {
        "es": "Cargando...", "de": "Laden...", "fr": "Chargement...",
        "ar": "جارٍ التحميل...", "ko": "로딩 중..."
    },
    "launchpad.appCard.age": {
        "es": "Edad {{rating}}", "de": "Alter {{rating}}", "fr": "Âge {{rating}}",
        "ar": "العمر {{rating}}", "ko": "연령 {{rating}}"
    },
    # Carousel
    "launchpad.carousel.open": {
        "es": "Abrir", "de": "Öffnen", "fr": "Ouvrir",
        "ar": "فتح", "ko": "열기"
    },
    "launchpad.carousel.getApp": {
        "es": "Obtener app", "de": "App laden", "fr": "Obtenir l'app",
        "ar": "الحصول على التطبيق", "ko": "앱 설치"
    },
    "launchpad.carousel.goToSlide": {
        "es": "Ir a la diapositiva {{number}}", "de": "Gehe zu Folie {{number}}", "fr": "Aller à la diapositive {{number}}",
        "ar": "الانتقال إلى الشريحة {{number}}", "ko": "슬라이드 {{number}}(으)로 이동"
    },
    # Become an app
    "launchpad.becomeAnApp.developerProgram": {
        "es": "Programa de desarrolladores", "de": "Entwicklerprogramm", "fr": "Programme développeur",
        "ar": "برنامج المطورين", "ko": "개발자 프로그램"
    },
    "launchpad.becomeAnApp.buildYourOwnApp": {
        "es": "Crea tu propia app", "de": "Erstelle deine eigene App", "fr": "Créez votre propre application",
        "ar": "أنشئ تطبيقك الخاص", "ko": "나만의 앱 만들기"
    },
    "launchpad.becomeAnApp.joinDeveloperCommunity": {
        "es": "Únete a nuestra comunidad de desarrolladores hoy", "de": "Trete heute unserer Entwickler-Community bei", "fr": "Rejoignez notre communauté de développeurs aujourd'hui",
        "ar": "انضم إلى مجتمع المطورين لدينا اليوم", "ko": "오늘 개발자 커뮤니티에 가입하세요"
    },
    # Detail modal
    "launchpad.detail.shareApp": {
        "es": "Compartir app", "de": "App teilen", "fr": "Partager l'app",
        "ar": "مشاركة التطبيق", "ko": "앱 공유"
    },
    "launchpad.detail.editPermissions": {
        "es": "Editar permisos", "de": "Berechtigungen bearbeiten", "fr": "Modifier les autorisations",
        "ar": "تعديل الأذونات", "ko": "권한 편집"
    },
    "launchpad.detail.uninstall": {
        "es": "Desinstalar", "de": "Deinstallieren", "fr": "Désinstaller",
        "ar": "إلغاء التثبيت", "ko": "제거"
    },
    "launchpad.detail.about": {
        "es": "Acerca de", "de": "Über", "fr": "À propos",
        "ar": "حول", "ko": "정보"
    },
    "launchpad.detail.preview": {
        "es": "Vista previa", "de": "Vorschau", "fr": "Aperçu",
        "ar": "معاينة", "ko": "미리보기"
    },
    "launchpad.detail.watch": {
        "es": "Ver", "de": "Ansehen", "fr": "Regarder",
        "ar": "مشاهدة", "ko": "시청"
    },
    "launchpad.detail.links": {
        "es": "Enlaces", "de": "Links", "fr": "Liens",
        "ar": "روابط", "ko": "링크"
    },
    "launchpad.detail.promoVideo": {
        "es": "Video promocional", "de": "Promo-Video", "fr": "Vidéo promotionnelle",
        "ar": "فيديو ترويجي", "ko": "홍보 영상"
    },
    "launchpad.detail.readMore": {
        "es": "Leer más", "de": "Mehr lesen", "fr": "Lire la suite",
        "ar": "اقرأ المزيد", "ko": "더 읽기"
    },
    "launchpad.detail.readLess": {
        "es": "Leer menos", "de": "Weniger lesen", "fr": "Lire moins",
        "ar": "اقرأ أقل", "ko": "접기"
    },
    "launchpad.detail.install": {
        "es": "Instalar", "de": "Installieren", "fr": "Installer",
        "ar": "تثبيت", "ko": "설치"
    },
    "launchpad.detail.moreOptions": {
        "es": "Más opciones", "de": "Weitere Optionen", "fr": "Plus d'options",
        "ar": "المزيد من الخيارات", "ko": "추가 옵션"
    },
    "launchpad.detail.linkCopied": {
        "es": "¡Enlace copiado al portapapeles!", "de": "Link in die Zwischenablage kopiert!", "fr": "Lien copié dans le presse-papiers !",
        "ar": "تم نسخ الرابط إلى الحافظة!", "ko": "링크가 클립보드에 복사되었습니다!"
    },
    "launchpad.detail.installFailed": {
        "es": "Error al instalar la app: {{error}}", "de": "App-Installation fehlgeschlagen: {{error}}", "fr": "Échec de l'installation de l'app : {{error}}",
        "ar": "فشل تثبيت التطبيق: {{error}}", "ko": "앱 설치 실패: {{error}}"
    },
    # Age restriction
    "launchpad.ageRestriction.title": {
        "es": "Restricción de edad", "de": "Altersbeschränkung", "fr": "Restriction d'âge",
        "ar": "مقيد بالعمر", "ko": "연령 제한"
    },
    "launchpad.ageRestriction.requiresAge": {
        "es": "Esta app requiere que los usuarios tengan <strong>{{age}}+</strong> años.", "de": "Diese App erfordert, dass Benutzer <strong>{{age}}+</strong> Jahre alt sind.", "fr": "Cette application exige que les utilisateurs aient <strong>{{age}}+</strong> ans.",
        "ar": "يتطلب هذا التطبيق أن يكون المستخدمون <strong>{{age}}+</strong> سنوات.", "ko": "이 앱은 사용자가 <strong>{{age}}+</strong>세 이상이어야 합니다."
    },
    "launchpad.ageRestriction.notMeetRequirement": {
        "es": "Según la fecha de nacimiento de tu perfil, no cumples con el requisito de edad mínima para esta app.", "de": "Basierend auf dem Geburtsdatum deines Profils erfüllst du die Mindestaltersanforderung für diese App nicht.", "fr": "D'après la date de naissance de votre profil, vous ne répondez pas à l'exigence d'âge minimum pour cette application.",
        "ar": "بناءً على تاريخ ميلاد ملفك الشخصي، لا تستوفي الحد الأدنى لمتطلبات العمر لهذا التطبيق.", "ko": "프로필의 생년월일을 기반으로 이 앱의 최소 연령 요건을 충족하지 않습니다."
    },
    "launchpad.ageRestriction.ok": {
        "es": "OK", "de": "OK", "fr": "OK",
        "ar": "حسناً", "ko": "확인"
    },
    "launchpad.detail.dateOfBirth": {
        "es": "Fecha de nacimiento", "de": "Geburtsdatum", "fr": "Date de naissance",
        "ar": "تاريخ الميلاد", "ko": "생년월일"
    },
    # Toasts — general
    "toasts.copied": {
        "es": "Copiado al portapapeles", "de": "In die Zwischenablage kopiert", "fr": "Copié dans le presse-papiers",
        "ar": "تم النسخ إلى الحافظة", "ko": "클립보드에 복사됨"
    },
    "toasts.copyFailed": {
        "es": "No se pudo copiar al portapapeles", "de": "Kopieren in die Zwischenablage fehlgeschlagen", "fr": "Impossible de copier dans le presse-papiers",
        "ar": "تعذر النسخ إلى الحافظة", "ko": "클립보드에 복사할 수 없습니다"
    },
    "toasts.linkCopied": {
        "es": "Enlace copiado al portapapeles", "de": "Link in die Zwischenablage kopiert", "fr": "Lien copié dans le presse-papiers",
        "ar": "تم نسخ الرابط إلى الحافظة", "ko": "링크가 클립보드에 복사됨"
    },
    "toasts.linkCopyFailed": {
        "es": "No se pudo copiar el enlace al portapapeles", "de": "Link konnte nicht in die Zwischenablage kopiert werden", "fr": "Impossible de copier le lien dans le presse-papiers",
        "ar": "تعذر نسخ الرابط إلى الحافظة", "ko": "링크를 클립보드에 복사할 수 없습니다"
    },
    "toasts.jsonCopied": {
        "es": "JSON copiado al portapapeles", "de": "JSON in die Zwischenablage kopiert", "fr": "JSON copié dans le presse-papiers",
        "ar": "تم نسخ JSON إلى الحافظة", "ko": "JSON이 클립보드에 복사됨"
    },
    "toasts.jsonCopyFailed": {
        "es": "No se pudo copiar JSON al portapapeles", "de": "JSON konnte nicht in die Zwischenablage kopiert werden", "fr": "Impossible de copier le JSON dans le presse-papiers",
        "ar": "تعذر نسخ JSON إلى الحافظة", "ko": "JSON을 클립보드에 복사할 수 없습니다"
    },
    "toasts.credentialClaimed": {
        "es": "¡Credencial reclamada exitosamente!", "de": "Berechtigung erfolgreich beansprucht!", "fr": "Accréditation réclamée avec succès !",
        "ar": "تم المطالبة ببيانات الاعتماد بنجاح!", "ko": "자격 증명이 성공적으로 수령되었습니다!"
    },
    "toasts.credentialClaimFailed": {
        "es": "No se pudo reclamar la credencial", "de": "Berechtigung konnte nicht beansprucht werden", "fr": "Impossible de réclamer l'accréditation",
        "ar": "تعذر المطالبة ببيانات الاعتماد", "ko": "자격 증명을 수령할 수 없습니다"
    },
    "toasts.alreadyClaimed": {
        "es": "Ya has reclamado esta credencial.", "de": "Du hast diese Berechtigung bereits beansprucht.", "fr": "Vous avez déjà réclamé cette accréditation.",
        "ar": "لقد طالبت بالفعل ببيانات الاعتماد هذه.", "ko": "이 자격 증명은 이미 수령하셨습니다."
    },
    "toasts.claimOops": {
        "es": "Ups, no pudimos reclamar la credencial.", "de": "Hoppla, wir konnten die Berechtigung nicht beanspruchen.", "fr": "Oups, nous n'avons pas pu réclamer l'accréditation.",
        "ar": "عذراً، لم نتمكن من المطالبة ببيانات الاعتماد.", "ko": "죄송합니다, 자격 증명을 수령하지 못했습니다."
    },
    "toasts.claimOopsPlural": {
        "es": "Ups, no pudimos reclamar las credenciales.", "de": "Hoppla, wir konnten die Berechtigungen nicht beanspruchen.", "fr": "Oups, nous n'avons pas pu réclamer les accréditations.",
        "ar": "عذراً، لم نتمكن من المطالبة ببيانات الاعتماد.", "ko": "죄송합니다, 자격 증명들을 수령하지 못했습니다."
    },
    "toasts.selectCredential": {
        "es": "Selecciona al menos una credencial para reclamar.", "de": "Wähle mindestens eine Berechtigung zum Beanspruchen aus.", "fr": "Veuillez sélectionner au moins une accréditation à réclamer.",
        "ar": "يرجى اختيار بيانات اعتماد واحدة على الأقل للمطالبة بها.", "ko": "수령할 자격 증명을 하나 이상 선택하세요."
    },
    "toasts.credentialsClaimedCount": {
        "es": "¡Se reclamaron {{count}} credencial(es) exitosamente!", "de": "{{count}} Berechtigung(en) erfolgreich beansprucht!", "fr": "{{count}} accréditation(s) réclamée(s) avec succès !",
        "ar": "تم المطالبة بـ {{count}} بيانات اعتماد بنجاح!", "ko": "{{count}}개 자격 증명이 성공적으로 수령되었습니다!"
    },
    "toasts.acceptFailed": {
        "es": "Ups, no pudimos aceptar las credenciales. Por favor, intenta de nuevo.", "de": "Hoppla, wir konnten die Berechtigungen nicht akzeptieren. Bitte versuche es erneut.", "fr": "Oups, nous n'avons pas pu accepter les accréditations. Veuillez réessayer.",
        "ar": "عذراً، لم نتمكن من قبول بيانات الاعتماد. يرجى المحاولة مرة أخرى.", "ko": "죄송합니다, 자격 증명을 수락하지 못했습니다. 다시 시도해 주세요."
    },
    "toasts.rejectFailed": {
        "es": "Ups, no pudimos rechazar las credenciales. Por favor, intenta de nuevo.", "de": "Hoppla, wir konnten die Berechtigungen nicht ablehnen. Bitte versuche es erneut.", "fr": "Oups, nous n'avons pas pu rejeter les accréditations. Veuillez réessayer.",
        "ar": "عذراً، لم نتمكن من رفض بيانات الاعتماد. يرجى المحاولة مرة أخرى.", "ko": "죄송합니다, 자격 증명을 거절하지 못했습니다. 다시 시도해 주세요."
    },
    # Toasts — boost
    "toasts.boost.boostIssuedSuccess": {
        "es": "Boost emitido exitosamente", "de": "Boost erfolgreich ausgestellt", "fr": "Boost émis avec succès",
        "ar": "تم إصدار Boost بنجاح", "ko": "부스트가 성공적으로 발급됨"
    },
    "toasts.boost.boostIssuedError": {
        "es": "Error al emitir boost", "de": "Fehler beim Ausstellen des Boosts", "fr": "Erreur lors de l'émission du boost",
        "ar": "خطأ في إصدار Boost", "ko": "부스트 발급 오류"
    },
    "toasts.boost.boostSavedSuccess": {
        "es": "Boost guardado exitosamente", "de": "Boost erfolgreich gespeichert", "fr": "Boost enregistré avec succès",
        "ar": "تم حفظ Boost بنجاح", "ko": "부스트가 성공적으로 저장됨"
    },
    "toasts.boost.boostSaveFailed": {
        "es": "No se pudo guardar el boost", "de": "Boost konnte nicht gespeichert werden", "fr": "Impossible d'enregistrer le boost",
        "ar": "تعذر حفظ Boost", "ko": "부스트를 저장할 수 없습니다"
    },
    "toasts.boost.walletNotInitialized": {
        "es": "La billetera no está inicializada", "de": "Wallet ist nicht initialisiert", "fr": "Le portefeuille n'est pas initialisé",
        "ar": "المحفظة غير مهيأة", "ko": "지갑이 초기화되지 않았습니다"
    },
    "toasts.boost.deleteCredentialError": {
        "es": "Error al eliminar credencial: no se pudo ubicar el ID del registro.", "de": "Fehler beim Löschen der Berechtigung: Datensatz-ID nicht gefunden.", "fr": "Erreur lors de la suppression de l'accréditation : impossible de localiser l'ID d'enregistrement.",
        "ar": "خطأ في حذف بيانات الاعتماد: تعذر تحديد موقع معرف السجل.", "ko": "자격 증명 삭제 오류: 레코드 ID를 찾을 수 없습니다."
    },
    "toasts.boost.shareLinkCopied": {
        "es": "Enlace para compartir copiado al portapapeles", "de": "Freigabelink in die Zwischenablage kopiert", "fr": "Lien de partage copié dans le presse-papiers",
        "ar": "تم نسخ رابط المشاركة إلى الحافظة", "ko": "공유 링크가 클립보드에 복사됨"
    },
    "toasts.boost.shareLinkCopyFailed": {
        "es": "No se pudo copiar el enlace para compartir", "de": "Freigabelink konnte nicht kopiert werden", "fr": "Impossible de copier le lien de partage",
        "ar": "تعذر نسخ رابط المشاركة", "ko": "공유 링크를 복사할 수 없습니다"
    },
    "toasts.boost.templateIdCopied": {
        "es": "ID de plantilla copiado al portapapeles", "de": "Vorlagen-ID in die Zwischenablage kopiert", "fr": "ID de modèle copié dans le presse-papiers",
        "ar": "تم نسخ معرف القالب إلى الحافظة", "ko": "템플릿 ID가 클립보드에 복사됨"
    },
    "toasts.boost.templateIdCopyFailed": {
        "es": "No se pudo copiar el ID de plantilla", "de": "Vorlagen-ID konnte nicht kopiert werden", "fr": "Impossible de copier l'ID de modèle",
        "ar": "تعذر نسخ معرف القالب", "ko": "템플릿 ID를 복사할 수 없습니다"
    },
    "toasts.boost.boostLinkCopied": {
        "es": "Enlace del boost copiado al portapapeles", "de": "Boost-Link in die Zwischenablage kopiert", "fr": "Lien du boost copié dans le presse-papiers",
        "ar": "تم نسخ رابط Boost إلى الحافظة", "ko": "부스트 링크가 클립보드에 복사됨"
    },
    "toasts.boost.boostLinkCopyFailed": {
        "es": "No se pudo copiar el enlace del boost", "de": "Boost-Link konnte nicht kopiert werden", "fr": "Impossible de copier le lien du boost",
        "ar": "تعذر نسخ رابط Boost", "ko": "부스트 링크를 복사할 수 없습니다"
    },
    "toasts.boost.viewingEnabled": {
        "es": "Visualización habilitada. Ahora puedes generar enlaces de reclamación.", "de": "Ansicht aktiviert. Du kannst jetzt Beanspruchungslinks generieren.", "fr": "Consultation activée. Vous pouvez maintenant générer des liens de réclamation.",
        "ar": "تم تمكين العرض. يمكنك الآن إنشاء روابط المطالبة.", "ko": "보기가 활성화되었습니다. 이제 수령 링크를 생성할 수 있습니다."
    },
    "toasts.boost.permissionsUpdateFailed": {
        "es": "No se pudieron actualizar los permisos. Por favor, intenta de nuevo.", "de": "Berechtigungen konnten nicht aktualisiert werden. Bitte versuche es erneut.", "fr": "Impossible de mettre à jour les autorisations. Veuillez réessayer.",
        "ar": "تعذر تحديث الأذونات. يرجى المحاولة مرة أخرى.", "ko": "권한을 업데이트할 수 없습니다. 다시 시도해 주세요."
    },
    "toasts.boost.contactLinkCopied": {
        "es": "Enlace de contacto copiado al portapapeles", "de": "Kontaktlink in die Zwischenablage kopiert", "fr": "Lien de contact copié dans le presse-papiers",
        "ar": "تم نسخ رابط جهة الاتصال إلى الحافظة", "ko": "연락처 링크가 클립보드에 복사됨"
    },
    "toasts.boost.contactLinkCopyFailed": {
        "es": "No se pudo copiar el enlace de contacto", "de": "Kontaktlink konnte nicht kopiert werden", "fr": "Impossible de copier le lien de contact",
        "ar": "تعذر نسخ رابط جهة الاتصال", "ko": "연락처 링크를 복사할 수 없습니다"
    },
    "toasts.boost.endorsementLinkCopied": {
        "es": "Enlace copiado al portapapeles", "de": "Link in die Zwischenablage kopiert", "fr": "Lien copié dans le presse-papiers",
        "ar": "تم نسخ الرابط إلى الحافظة", "ko": "링크가 클립보드에 복사됨"
    },
    "toasts.boost.endorsementRequestFailed": {
        "es": "Error al enviar la solicitud de respaldo", "de": "Endorsement-Anfrage konnte nicht gesendet werden", "fr": "Échec de l'envoi de la demande d'approbation",
        "ar": "فشل إرسال طلب التأييد", "ko": "보증 요청 전송 실패"
    },
    # Toasts — resume
    "toasts.resume.publishedSuccess": {
        "es": "Credencial de currículum LER-RS publicada exitosamente.", "de": "LER-RS-Lebenslauf-Berechtigung erfolgreich veröffentlicht.", "fr": "Accréditation de cv LER-RS publiée avec succès.",
        "ar": "تم نشر بيانات اعتماد السيرة الذاتية LER-RS بنجاح.", "ko": "LER-RS 이력서 자격 증명이 성공적으로 게시되었습니다."
    },
    "toasts.resume.downloadSuccess": {
        "es": "Currículum descargado exitosamente.", "de": "Lebenslauf erfolgreich heruntergeladen.", "fr": "CV téléchargé avec succès.",
        "ar": "تم تنزيل السيرة الذاتية بنجاح.", "ko": "이력서가 성공적으로 다운로드되었습니다."
    },
    "toasts.resume.downloadFailed": {
        "es": "Error al guardar y descargar el currículum.", "de": "Speichern und Herunterladen des Lebenslaufs fehlgeschlagen.", "fr": "Échec de l'enregistrement et du téléchargement du CV.",
        "ar": "فشل حفظ وتنزيل السيرة الذاتية.", "ko": "이력서를 저장하고 다운로드하지 못했습니다."
    },
    "toasts.resume.publishFailed": {
        "es": "Error al publicar la credencial de currículum LER-RS.", "de": "Veröffentlichung der LER-RS-Lebenslauf-Berechtigung fehlgeschlagen.", "fr": "Échec de la publication de l'accréditation de cv LER-RS.",
        "ar": "فشل نشر بيانات اعتماد السيرة الذاتية LER-RS.", "ko": "LER-RS 이력서 자격 증명 게시에 실패했습니다."
    },
    "toasts.resume.loadedEditMode": {
        "es": "Currículum cargado en modo de edición.", "de": "Lebenslauf in den Bearbeitungsmodus geladen.", "fr": "CV chargé en mode édition.",
        "ar": "تم تحميل السيرة الذاتية في وضع التعديل.", "ko": "편집 모드로 이력서가 로드되었습니다."
    },
    "toasts.resume.loadFailed": {
        "es": "Error al cargar el currículum seleccionado.", "de": "Ausgewählter Lebenslauf konnte nicht geladen werden.", "fr": "Échec du chargement du CV sélectionné.",
        "ar": "فشل تحميل السيرة الذاتية المحددة.", "ko": "선택한 이력서를 로드하지 못했습니다."
    },
    "toasts.resume.newDraft": {
        "es": "Se inició un nuevo borrador de currículum.", "de": "Neuer Lebenslauf-Entwurf gestartet.", "fr": "Nouveau brouillon de CV commencé.",
        "ar": "تم بدء مسودة سيرة ذاتية جديدة.", "ko": "새 이력서 초안이 시작되었습니다."
    },
    "toasts.resume.notAvailableToShare": {
        "es": "Este currículum aún no está disponible para compartir.", "de": "Dieser Lebenslauf ist noch nicht zum Teilen verfügbar.", "fr": "Ce CV n'est pas encore disponible pour le partage.",
        "ar": "هذه السيرة الذاتية غير متاحة للمشاركة بعد.", "ko": "이 이력서는 아직 공유할 수 없습니다."
    },
    "toasts.resume.shareLinkGenerated": {
        "es": "No se pudo generar el enlace para compartir el currículum.", "de": "Freigabelink für den Lebenslauf konnte nicht generiert werden.", "fr": "Impossible de générer le lien de partage du CV.",
        "ar": "تعذر إنشاء رابط مشاركة السيرة الذاتية.", "ko": "이력서 공유 링크를 생성할 수 없습니다."
    },
    "toasts.resume.linkCopied": {
        "es": "Enlace del currículum copiado al portapapeles", "de": "Lebenslauf-Link in die Zwischenablage kopiert", "fr": "Lien du CV copié dans le presse-papiers",
        "ar": "تم نسخ رابط السيرة الذاتية إلى الحافظة", "ko": "이력서 링크가 클립보드에 복사됨"
    },
    "toasts.resume.linkCopyFailed": {
        "es": "No se pudo copiar el enlace del currículum", "de": "Lebenslauf-Link konnte nicht kopiert werden", "fr": "Impossible de copier le lien du CV",
        "ar": "تعذر نسخ رابط السيرة الذاتية", "ko": "이력서 링크를 복사할 수 없습니다"
    },
    "toasts.resume.selfIssueNoProfile": {
        "es": "No se puede emitir sin un perfil.", "de": "Selbstausstellung ohne Profil nicht möglich.", "fr": "Impossible d'auto-émettre sans profil.",
        "ar": "تعذر الإصدار الذاتي بدون ملف شخصي.", "ko": "프로필 없이 자체 발행할 수 없습니다."
    },
    "toasts.resume.selfIssueFailed": {
        "es": "No se pudo emitir la credencial", "de": "Selbstausstellung der Berechtigung fehlgeschlagen", "fr": "Impossible d'auto-émettre l'accréditation",
        "ar": "تعذر الإصدار الذاتي لبيانات الاعتماد", "ko": "자격 증명 자체 발행 실패"
    },
    "toasts.resume.verifiedResumeLinkCopied": {
        "es": "Enlace de currículum verificado copiado al portapapeles", "de": "Verifizierter Lebenslauf-Link in die Zwischenablage kopiert", "fr": "Lien de CV vérifié copié dans le presse-papiers",
        "ar": "تم نسخ رابط السيرة الذاتية المعتمدة إلى الحافظة", "ko": "검증된 이력서 링크가 클립보드에 복사됨"
    },
    "toasts.resume.verifiedResumeLinkCopyFailed": {
        "es": "No se pudo copiar el enlace de currículum verificado", "de": "Verifizierter Lebenslauf-Link konnte nicht kopiert werden", "fr": "Impossible de copier le lien de CV vérifié",
        "ar": "تعذر نسخ رابط السيرة الذاتية المعتمدة", "ko": "검증된 이력서 링크를 복사할 수 없습니다"
    },
    # Toasts — credential
    "toasts.credential.addedToLearnCard": {
        "es": "Credencial agregada a LearnCard", "de": "Berechtigung zu LearnCard hinzugefügt", "fr": "Accréditation ajoutée à LearnCard",
        "ar": "تمت إضافة بيانات الاعتماد إلى LearnCard", "ko": "자격 증명이 LearnCard에 추가됨"
    },
    # Toasts — family
    "toasts.family.profileCreated": {
        "es": "¡Perfil \"{{name}}\" creado exitosamente!", "de": "Profil \"{{name}}\" erfolgreich erstellt!", "fr": "Profil \"{{name}}\" créé avec succès !",
        "ar": "تم إنشاء الملف الشخصي \"{{name}}\" بنجاح!", "ko": "프로필 \"{{name}}\"이(가) 성공적으로 생성되었습니다!"
    },
    "toasts.family.profileCreateFailed": {
        "es": "Error al crear \"{{name}}\": {{error}}", "de": "Fehler beim Erstellen von \"{{name}}\": {{error}}", "fr": "Échec de la création de \"{{name}}\" : {{error}}",
        "ar": "فشل إنشاء \"{{name}}\": {{error}}", "ko": "\"{{name}}\" 생성 실패: {{error}}"
    },
    "toasts.family.boostLinkCopied": {
        "es": "Enlace del boost copiado al portapapeles", "de": "Boost-Link in die Zwischenablage kopiert", "fr": "Lien du boost copié dans le presse-papiers",
        "ar": "تم نسخ رابط Boost إلى الحافظة", "ko": "부스트 링크가 클립보드에 복사됨"
    },
    "toasts.family.boostLinkCopyFailed": {
        "es": "No se pudo copiar el enlace del boost", "de": "Boost-Link konnte nicht kopiert werden", "fr": "Impossible de copier le lien du boost",
        "ar": "تعذر نسخ رابط Boost", "ko": "부스트 링크를 복사할 수 없습니다"
    },
    "toasts.family.boostIssuedError": {
        "es": "Error al emitir boost", "de": "Fehler beim Ausstellen des Boosts", "fr": "Erreur lors de l'émission du boost",
        "ar": "خطأ في إصدار Boost", "ko": "부스트 발급 오류"
    },
    "toasts.family.boostUpdateError": {
        "es": "Error al actualizar boost", "de": "Fehler beim Aktualisieren des Boosts", "fr": "Erreur lors de la mise à jour du boost",
        "ar": "خطأ في تحديث Boost", "ko": "부스트 업데이트 오류"
    },
    # Toasts — skills
    "toasts.skills.savedSuccess": {
        "es": "¡Habilidades guardadas exitosamente!", "de": "Fähigkeiten erfolgreich gespeichert!", "fr": "Compétences enregistrées avec succès !",
        "ar": "تم حفظ المهارات بنجاح!", "ko": "기술이 성공적으로 저장되었습니다!"
    },
    "toasts.skills.saveError": {
        "es": "¡Error al guardar habilidades!{{error}}", "de": "Fehler beim Speichern der Fähigkeiten!{{error}}", "fr": "Erreur lors de l'enregistrement des compétences !{{error}}",
        "ar": "خطأ في حفظ المهارات!{{error}}", "ko": "기술 저장 오류!{{error}}"
    },
    "toasts.skills.suggestionThanks": {
        "es": "¡Gracias por tu sugerencia!", "de": "Danke für deinen Vorschlag!", "fr": "Merci pour votre suggestion !",
        "ar": "شكراً على اقتراحك!", "ko": "제안해 주셔서 감사합니다!"
    },
    "toasts.skills.fillJobTitle": {
        "es": "Por favor, completa el puesto y el empleador", "de": "Bitte gib die Position und den Arbeitgeber an", "fr": "Veuillez remplir le poste et l'employeur",
        "ar": "يرجى ملء المسمى الوظيفي واسم صاحب العمل", "ko": "직책 및 고용주를 입력해 주세요"
    },
    "toasts.skills.workHistoryCreated": {
        "es": "Se ha creado tu credencial de historial laboral", "de": "Deine Berufslaufbahn-Berechtigung wurde erstellt", "fr": "Votre accréditation d'historique professionnel a été créée",
        "ar": "تم إنشاء بيانات اعتماد سجل العمل الخاص بك", "ko": "직무 이력 자격 증명이 생성되었습니다"
    },
    "toasts.skills.frameworkSynced": {
        "es": "Marco sincronizado exitosamente.", "de": "Rahmen erfolgreich synchronisiert.", "fr": "Cadre synchronisé avec succès.",
        "ar": "تم مزامنة الإطار بنجاح.", "ko": "프레임워크가 동기화되었습니다."
    },
    "toasts.skills.frameworkSyncFailed": {
        "es": "No se pudo sincronizar el marco.", "de": "Rahmen konnte nicht synchronisiert werden.", "fr": "Impossible de synchroniser le cadre.",
        "ar": "تعذر مزامنة الإطار.", "ko": "프레임워크를 동기화할 수 없습니다."
    },
    "toasts.skills.pasteValidLink": {
        "es": "Por favor, pega un enlace válido de marco OpenSALT.", "de": "Bitte fügen Sie einen gültigen OpenSALT-Rahmen-Link ein.", "fr": "Veuillez coller un lien de cadre OpenSALT valide.",
        "ar": "يرجى لصق رابط إطار OpenSALT صالح.", "ko": "유효한 OpenSALT 프레임워크 링크를 붙여넣으세요."
    },
    "toasts.skills.frameworkImported": {
        "es": "Marco OpenSALT importado y sincronizado.", "de": "OpenSALT-Rahmen importiert und synchronisiert.", "fr": "Cadre OpenSALT importé et synchronisé.",
        "ar": "تم استيراد ومزامنة إطار OpenSALT.", "ko": "OpenSALT 프레임워크가 가져오기 및 동기화되었습니다."
    },
    "toasts.skills.frameworkImportFailed": {
        "es": "No se pudo importar el marco.", "de": "Rahmen konnte nicht importiert werden.", "fr": "Impossible d'importer le cadre.",
        "ar": "تعذر استيراد الإطار.", "ko": "프레임워크를 가져올 수 없습니다."
    },
    "toasts.skills.updateError": {
        "es": "Error al actualizar habilidades: {{error}}", "de": "Fehler beim Aktualisieren der Fähigkeiten: {{error}}", "fr": "Erreur lors de la mise à jour des compétences : {{error}}",
        "ar": "خطأ في تحديث المهارات: {{error}}", "ko": "기술 업데이트 오류: {{error}}"
    },
    # Toasts — goals
    "toasts.goals.saveError": {
        "es": "¡Error al guardar metas!{{error}}", "de": "Fehler beim Speichern der Ziele!{{error}}", "fr": "Erreur lors de l'enregistrement des objectifs !{{error}}",
        "ar": "خطأ في حفظ الأهداف!{{error}}", "ko": "목표 저장 오류!{{error}}"
    },
    # Toasts — general
    "toasts.general.somethingWentWrong": {
        "es": "Algo salió mal: {{error}}", "de": "Etwas ist schiefgelaufen: {{error}}", "fr": "Quelque chose s'est mal passé : {{error}}",
        "ar": "حدث خطأ ما: {{error}}", "ko": "문제가 발생했습니다: {{error}}"
    },
    "toasts.general.failedToUpdateTerms": {
        "es": "Error al actualizar los términos: {{error}}", "de": "Bedingungen konnten nicht aktualisiert werden: {{error}}", "fr": "Échec de la mise à jour des conditions : {{error}}",
        "ar": "فشل تحديث الشروط: {{error}}", "ko": "약관 업데이트 실패: {{error}}"
    },
    # Toasts — consent flow
    "toasts.consentFlow.connected": {
        "es": "Conectado exitosamente a {{name}}", "de": "Erfolgreich mit {{name}} verbunden", "fr": "Connecté avec succès à {{name}}",
        "ar": "تم الاتصال بنجاح بـ {{name}}", "ko": "{{name}}에 성공적으로 연결됨"
    },
    "toasts.consentFlow.acceptFailed": {
        "es": "Error al aceptar el contrato: {{error}}", "de": "Vertragsannahme fehlgeschlagen: {{error}}", "fr": "Échec de l'acceptation du contrat : {{error}}",
        "ar": "فشل قبول العقد: {{error}}", "ko": "계약 수락 실패: {{error}}"
    },
    "toasts.consentFlow.permissionsUpdated": {
        "es": "Permisos actualizados", "de": "Berechtigungen aktualisiert", "fr": "Autorisations mises à jour",
        "ar": "تم تحديث الأذونات", "ko": "권한이 업데이트됨"
    },
    "toasts.consentFlow.permissionsUpdateFailed": {
        "es": "No se pudieron actualizar los permisos", "de": "Berechtigungen konnten nicht aktualisiert werden", "fr": "Impossible de mettre à jour les autorisations",
        "ar": "تعذر تحديث الأذونات", "ko": "권한을 업데이트할 수 없습니다"
    },
    # Toasts — data source
    "toasts.dataSource.syncedSuccess": {
        "es": "¡Fuente de datos sincronizada exitosamente!", "de": "Datenquelle erfolgreich synchronisiert!", "fr": "Source de données synchronisée avec succès !",
        "ar": "تم مزامنة مصدر البيانات بنجاح!", "ko": "데이터 소스가 성공적으로 동기화되었습니다!"
    },
    # Toasts — launchpad
    "toasts.launchpad.installFailed": {
        "es": "Error al instalar la app: {{error}}", "de": "App-Installation fehlgeschlagen: {{error}}", "fr": "Échec de l'installation de l'app : {{error}}",
        "ar": "فشل تثبيت التطبيق: {{error}}", "ko": "앱 설치 실패: {{error}}"
    },
    "toasts.launchpad.roleUpdated": {
        "es": "Rol actualizado", "de": "Rolle aktualisiert", "fr": "Rôle mis à jour",
        "ar": "تم تحديث الدور", "ko": "역할 업데이트됨"
    },
    "toasts.launchpad.nowRole": {
        "es": "Ahora eres {{role}}.", "de": "Du bist jetzt {{role}}.", "fr": "Vous êtes maintenant {{role}}.",
        "ar": "أنت الآن {{role}}.", "ko": "이제 {{role}}입니다."
    },
    "toasts.launchpad.unableToUpdateRole": {
        "es": "No se pudo actualizar el rol", "de": "Rolle konnte nicht aktualisiert werden", "fr": "Impossible de mettre à jour le rôle",
        "ar": "تعذر تحديث الدور", "ko": "역할을 업데이트할 수 없습니다"
    },
    "toasts.launchpad.unableToOpenRequestInsights": {
        "es": "No se pudo abrir Solicitar Información", "de": "Einblicke anfordern konnte nicht geöffnet werden", "fr": "Impossible d'ouvrir Demander des analyses",
        "ar": "تعذر فتح طلب الرؤى", "ko": "인사이트 요청을 열 수 없습니다"
    },
    # Toasts — onboarding
    "toasts.onboarding.errorCreatingProfile": {
        "es": "Error al crear perfil", "de": "Fehler beim Erstellen des Profils", "fr": "Erreur lors de la création du profil",
        "ar": "خطأ في إنشاء الملف الشخصي", "ko": "프로필 생성 오류"
    },
    "toasts.onboarding.unableToJoinNetwork": {
        "es": "No se pudo unir a la red", "de": "Netzwerk konnte nicht beigetreten werden", "fr": "Impossible de rejoindre le réseau",
        "ar": "تعذر الانضمام إلى الشبكة", "ko": "네트워크에 가입할 수 없습니다"
    },
    # Toasts — QR
    "toasts.qr.scanningFailed": {
        "es": "No se pudo escanear el código QR", "de": "QR-Code konnte nicht gescannt werden", "fr": "Impossible de scanner le code QR",
        "ar": "تعذر مسح رمز QR", "ko": "QR 코드를 스캔할 수 없습니다"
    },
    # Toasts — contacts
    "toasts.contacts.connectionSent": {
        "es": "¡Solicitud de conexión enviada!", "de": "Verbindungsanfrage gesendet!", "fr": "Demande de connexion envoyée !",
        "ar": "تم إرسال طلب الاتصال!", "ko": "연결 요청이 전송되었습니다!"
    },
    "toasts.contacts.connectionSendFailed": {
        "es": "Ocurrió un error, no se pudo enviar la solicitud de conexión.", "de": "Ein Fehler ist aufgetreten, Verbindungsanfrage konnte nicht gesendet werden.", "fr": "Une erreur s'est produite, impossible d'envoyer la demande de connexion.",
        "ar": "حدث خطأ، تعذر إرسال طلب الاتصال.", "ko": "오류가 발생하여 연결 요청을 보낼 수 없습니다."
    },
    "toasts.contacts.connectedSuccessfully": {
        "es": "¡Conectado exitosamente!", "de": "Erfolgreich verbunden!", "fr": "Connecté avec succès !",
        "ar": "تم الاتصال بنجاح!", "ko": "성공적으로 연결되었습니다!"
    },
    "toasts.contacts.connectFailed": {
        "es": "¡Ocurrió un error, no se pudo conectar!", "de": "Ein Fehler ist aufgetreten, Verbindung fehlgeschlagen!", "fr": "Une erreur s'est produite, impossible de se connecter !",
        "ar": "حدث خطأ، تعذر الاتصال!", "ko": "오류가 발생하여 연결할 수 없습니다!"
    },
    "toasts.contacts.acceptFailed": {
        "es": "Ocurrió un error, no se pudo aceptar la solicitud", "de": "Ein Fehler ist aufgetreten, Anfrage konnte nicht akzeptiert werden", "fr": "Une erreur s'est produite, impossible d'accepter la demande",
        "ar": "حدث خطأ، تعذر قبول الطلب", "ko": "오류가 발생하여 요청을 수락할 수 없습니다"
    },
    "toasts.contacts.blockFailed": {
        "es": "Ocurrió un error, no se pudo bloquear al usuario", "de": "Ein Fehler ist aufgetreten, Benutzer konnte nicht blockiert werden", "fr": "Une erreur s'est produite, impossible de bloquer l'utilisateur",
        "ar": "حدث خطأ، تعذر حظر المستخدم", "ko": "오류가 발생하여 사용자를 차단할 수 없습니다"
    },
    "toasts.contacts.blocked": {
        "es": "Usuario bloqueado", "de": "Benutzer blockiert", "fr": "Utilisateur bloqué",
        "ar": "تم حظر المستخدم", "ko": "사용자 차단됨"
    },
    "toasts.contacts.unblocked": {
        "es": "Usuario desbloqueado", "de": "Benutzer entblockiert", "fr": "Utilisateur débloqué",
        "ar": "تم إلغاء حظر المستخدم", "ko": "사용자 차단 해제됨"
    },
    "toasts.contacts.removeFailed": {
        "es": "Error al eliminar contacto", "de": "Kontakt konnte nicht entfernt werden", "fr": "Échec de la suppression du contact",
        "ar": "فشل إزالة جهة الاتصال", "ko": "연락처 제거 실패"
    },
    "toasts.contacts.removed": {
        "es": "Contacto eliminado", "de": "Kontakt entfernt", "fr": "Contact supprimé",
        "ar": "تمت إزالة جهة الاتصال", "ko": "연락처 제거됨"
    },
    "toasts.contacts.disconnectFailed": {
        "es": "Error al desconectar", "de": "Trennung fehlgeschlagen", "fr": "Échec de la déconnexion",
        "ar": "فشل قطع الاتصال", "ko": "연결 해제 실패"
    },
    "toasts.contacts.disconnected": {
        "es": "Desconectado", "de": "Getrennt", "fr": "Déconnecté",
        "ar": "تم قطع الاتصال", "ko": "연결 해제됨"
    },
    "toasts.contacts.didCopied": {
        "es": "DID copiado al portapapeles", "de": "DID in die Zwischenablage kopiert", "fr": "DID copié dans le presse-papiers",
        "ar": "تم نسخ DID إلى الحافظة", "ko": "DID가 클립보드에 복사됨"
    },
    "toasts.contacts.requestSent": {
        "es": "Solicitud enviada", "de": "Anfrage gesendet", "fr": "Demande envoyée",
        "ar": "تم إرسال الطلب", "ko": "요청 전송됨"
    },
    "toasts.contacts.requestFailed": {
        "es": "Error al enviar solicitud", "de": "Anfrage konnte nicht gesendet werden", "fr": "Échec de l'envoi de la demande",
        "ar": "فشل إرسال الطلب", "ko": "요청 전송 실패"
    },
    "toasts.contacts.inviteAlreadySent": {
        "es": "Ya has enviado una solicitud de conexión a este usuario.", "de": "Du hast bereits eine Verbindungsanfrage an diesen Benutzer gesendet.", "fr": "Vous avez déjà envoyé une demande de connexion à cet utilisateur.",
        "ar": "لقد أرسلت بالفعل طلب اتصال إلى هذا المستخدم.", "ko": "이미 이 사용자에게 연결 요청을 보냈습니다."
    },
    "toasts.contacts.alreadyConnected": {
        "es": "Ya estás conectado con este usuario.", "de": "Du bist bereits mit diesem Benutzer verbunden.", "fr": "Vous êtes déjà connecté avec cet utilisateur.",
        "ar": "أنت متصل بالفعل بهذا المستخدم.", "ko": "이미 이 사용자와 연결되어 있습니다."
    },
}

def set_nested(d, dotted_key, value):
    parts = dotted_key.split('.')
    for p in parts[:-1]:
        d = d.setdefault(p, {})
    d[parts[-1]] = value

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
    
    print(f'Updated {locale} with {len(TRANSLATIONS)} translations')
