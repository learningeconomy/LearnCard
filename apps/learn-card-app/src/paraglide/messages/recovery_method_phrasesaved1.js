/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Phrasesaved1Inputs */

const en_recovery_method_phrasesaved1 = /** @type {(inputs: Recovery_Method_Phrasesaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase is saved`)
};

const es_recovery_method_phrasesaved1 = /** @type {(inputs: Recovery_Method_Phrasesaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frase guardada`)
};

const fr_recovery_method_phrasesaved1 = /** @type {(inputs: Recovery_Method_Phrasesaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase enregistrée`)
};

const ar_recovery_method_phrasesaved1 = /** @type {(inputs: Recovery_Method_Phrasesaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ العبارة`)
};

/**
* | output |
* | --- |
* | "Phrase is saved" |
*
* @param {Recovery_Method_Phrasesaved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_phrasesaved1 = /** @type {((inputs?: Recovery_Method_Phrasesaved1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Phrasesaved1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_phrasesaved1(inputs)
	if (locale === "es") return es_recovery_method_phrasesaved1(inputs)
	if (locale === "fr") return fr_recovery_method_phrasesaved1(inputs)
	return ar_recovery_method_phrasesaved1(inputs)
});
export { recovery_method_phrasesaved1 as "recovery.method.phraseSaved" }