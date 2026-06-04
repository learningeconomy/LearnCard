/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Aidisabledprivacy2Inputs */

const en_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI features are currently disabled. You can enable them in Privacy & Data from your profile.`)
};

const es_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las funciones de IA están deshabilitadas. Puedes habilitarlas en Privacidad y Datos desde tu perfil.`)
};

const de_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI-Funktionen sind derzeit deaktiviert. Du kannst sie unter Datenschutz in deinem Profil aktivieren.`)
};

const ar_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ميزات الذكاء الاصطناعي معطلة حالياً. يمكنك تفعيلها من الخصوصية والبيانات في ملفك الشخصي.`)
};

const fr_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les fonctionnalités IA sont actuellement désactivées. Vous pouvez les activer dans Confidentialité et données depuis votre profil.`)
};

const ko_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI 기능이 현재 비활성화되어 있습니다. 프로필의 개인정보 및 데이터에서 활성화할 수 있습니다.`)
};

/**
* | output |
* | --- |
* | "AI features are currently disabled. You can enable them in Privacy & Data from your profile." |
*
* @param {Launchpad_Aidisabledprivacy2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_aidisabledprivacy2 = /** @type {((inputs?: Launchpad_Aidisabledprivacy2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Aidisabledprivacy2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_aidisabledprivacy2(inputs)
	if (locale === "es") return es_launchpad_aidisabledprivacy2(inputs)
	if (locale === "de") return de_launchpad_aidisabledprivacy2(inputs)
	if (locale === "ar") return ar_launchpad_aidisabledprivacy2(inputs)
	if (locale === "fr") return fr_launchpad_aidisabledprivacy2(inputs)
	return ko_launchpad_aidisabledprivacy2(inputs)
});
export { launchpad_aidisabledprivacy2 as "launchpad.aiDisabledPrivacy" }