/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Templateidcopyfailed3Inputs */

const en_toasts_boost_templateidcopyfailed3 = /** @type {(inputs: Toasts_Boost_Templateidcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy template ID to clipboard`)
};

const es_toasts_boost_templateidcopyfailed3 = /** @type {(inputs: Toasts_Boost_Templateidcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el ID de plantilla`)
};

const fr_toasts_boost_templateidcopyfailed3 = /** @type {(inputs: Toasts_Boost_Templateidcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier l'ID de modèle`)
};

const ar_toasts_boost_templateidcopyfailed3 = /** @type {(inputs: Toasts_Boost_Templateidcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ معرف القالب`)
};

/**
* | output |
* | --- |
* | "Unable to copy template ID to clipboard" |
*
* @param {Toasts_Boost_Templateidcopyfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_boost_templateidcopyfailed3 = /** @type {((inputs?: Toasts_Boost_Templateidcopyfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Templateidcopyfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_templateidcopyfailed3(inputs)
	if (locale === "es") return es_toasts_boost_templateidcopyfailed3(inputs)
	if (locale === "fr") return fr_toasts_boost_templateidcopyfailed3(inputs)
	return ar_toasts_boost_templateidcopyfailed3(inputs)
});
export { toasts_boost_templateidcopyfailed3 as "toasts.boost.templateIdCopyFailed" }