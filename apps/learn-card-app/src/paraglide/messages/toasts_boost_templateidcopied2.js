/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Templateidcopied2Inputs */

const en_toasts_boost_templateidcopied2 = /** @type {(inputs: Toasts_Boost_Templateidcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template ID copied to clipboard`)
};

const es_toasts_boost_templateidcopied2 = /** @type {(inputs: Toasts_Boost_Templateidcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de plantilla copiado al portapapeles`)
};

const fr_toasts_boost_templateidcopied2 = /** @type {(inputs: Toasts_Boost_Templateidcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de modèle copié dans le presse-papiers`)
};

const ar_toasts_boost_templateidcopied2 = /** @type {(inputs: Toasts_Boost_Templateidcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ معرف القالب إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Template ID copied to clipboard" |
*
* @param {Toasts_Boost_Templateidcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_boost_templateidcopied2 = /** @type {((inputs?: Toasts_Boost_Templateidcopied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Templateidcopied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_templateidcopied2(inputs)
	if (locale === "es") return es_toasts_boost_templateidcopied2(inputs)
	if (locale === "fr") return fr_toasts_boost_templateidcopied2(inputs)
	return ar_toasts_boost_templateidcopied2(inputs)
});
export { toasts_boost_templateidcopied2 as "toasts.boost.templateIdCopied" }