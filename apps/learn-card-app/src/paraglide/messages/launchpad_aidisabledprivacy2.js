/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Aidisabledprivacy2Inputs */

const en_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI features are currently disabled. You can enable them in Privacy & Data from your profile.`)
};

const es_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las funciones de IA están desactivadas. Puedes activarlas en Privacidad y Datos desde tu perfil.`)
};

const de_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI-Funktionen sind derzeit deaktiviert. Du kannst sie unter Privatsphäre und Daten in deinem Profil aktivieren.`)
};

const ar_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ميزات الذكاء الاصطناعي معطلة حالياً. يمكنك تفعيلها من قسم الخصوصية والبيانات في ملفك الشخصي.`)
};

/**
* | output |
* | --- |
* | "AI features are currently disabled. You can enable them in Privacy & Data from your profile." |
*
* @param {Launchpad_Aidisabledprivacy2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_aidisabledprivacy2 = /** @type {((inputs?: Launchpad_Aidisabledprivacy2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Aidisabledprivacy2Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_aidisabledprivacy2(inputs)
	if (locale === "es") return es_launchpad_aidisabledprivacy2(inputs)
	if (locale === "de") return de_launchpad_aidisabledprivacy2(inputs)
	return ar_launchpad_aidisabledprivacy2(inputs)
});
export { launchpad_aidisabledprivacy2 as "launchpad.aiDisabledPrivacy" }