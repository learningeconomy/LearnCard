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

const fr_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les fonctionnalités IA sont actuellement désactivées. Vous pouvez les activer dans Confidentialité et données depuis votre profil.`)
};

const ar_launchpad_aidisabledprivacy2 = /** @type {(inputs: Launchpad_Aidisabledprivacy2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ميزات الذكاء الاصطناعي معطلة حالياً. يمكنك تفعيلها من الخصوصية والبيانات في ملفك الشخصي.`)
};

/**
* | output |
* | --- |
* | "AI features are currently disabled. You can enable them in Privacy & Data from your profile." |
*
* @param {Launchpad_Aidisabledprivacy2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_aidisabledprivacy2 = /** @type {((inputs?: Launchpad_Aidisabledprivacy2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Aidisabledprivacy2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_aidisabledprivacy2(inputs)
	if (locale === "es") return es_launchpad_aidisabledprivacy2(inputs)
	if (locale === "fr") return fr_launchpad_aidisabledprivacy2(inputs)
	return ar_launchpad_aidisabledprivacy2(inputs)
});
export { launchpad_aidisabledprivacy2 as "launchpad.aiDisabledPrivacy" }