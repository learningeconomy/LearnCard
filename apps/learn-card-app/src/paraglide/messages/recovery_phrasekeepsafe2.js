/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrasekeepsafe2Inputs */

const en_recovery_phrasekeepsafe2 = /** @type {(inputs: Recovery_Phrasekeepsafe2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep it safe`)
};

const es_recovery_phrasekeepsafe2 = /** @type {(inputs: Recovery_Phrasekeepsafe2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guárdala bien`)
};

const fr_recovery_phrasekeepsafe2 = /** @type {(inputs: Recovery_Phrasekeepsafe2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gardez-la en sécurité`)
};

const ar_recovery_phrasekeepsafe2 = /** @type {(inputs: Recovery_Phrasekeepsafe2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احفظها بشكل آمن`)
};

/**
* | output |
* | --- |
* | "Keep it safe" |
*
* @param {Recovery_Phrasekeepsafe2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrasekeepsafe2 = /** @type {((inputs?: Recovery_Phrasekeepsafe2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrasekeepsafe2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrasekeepsafe2(inputs)
	if (locale === "es") return es_recovery_phrasekeepsafe2(inputs)
	if (locale === "fr") return fr_recovery_phrasekeepsafe2(inputs)
	return ar_recovery_phrasekeepsafe2(inputs)
});
export { recovery_phrasekeepsafe2 as "recovery.phraseKeepSafe" }