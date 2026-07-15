/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Phrasedesc1Inputs */

const en_recovery_method_phrasedesc1 = /** @type {(inputs: Recovery_Method_Phrasedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your 25-word phrase`)
};

const es_recovery_method_phrasedesc1 = /** @type {(inputs: Recovery_Method_Phrasedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa tu frase de 25 palabras`)
};

const fr_recovery_method_phrasedesc1 = /** @type {(inputs: Recovery_Method_Phrasedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez votre phrase de 25 mots`)
};

const ar_recovery_method_phrasedesc1 = /** @type {(inputs: Recovery_Method_Phrasedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your 25-word phrase`)
};

/**
* | output |
* | --- |
* | "Enter your 25-word phrase" |
*
* @param {Recovery_Method_Phrasedesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_phrasedesc1 = /** @type {((inputs?: Recovery_Method_Phrasedesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Phrasedesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_phrasedesc1(inputs)
	if (locale === "es") return es_recovery_method_phrasedesc1(inputs)
	if (locale === "fr") return fr_recovery_method_phrasedesc1(inputs)
	return ar_recovery_method_phrasedesc1(inputs)
});
export { recovery_method_phrasedesc1 as "recovery.method.phraseDesc" }