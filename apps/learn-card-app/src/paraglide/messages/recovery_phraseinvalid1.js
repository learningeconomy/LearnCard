/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phraseinvalid1Inputs */

const en_recovery_phraseinvalid1 = /** @type {(inputs: Recovery_Phraseinvalid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The recovery phrase doesn’t look right. Please check for typos.`)
};

const es_recovery_phraseinvalid1 = /** @type {(inputs: Recovery_Phraseinvalid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La frase de recuperación no parece correcta. Por favor revisa si hay errores.`)
};

const fr_recovery_phraseinvalid1 = /** @type {(inputs: Recovery_Phraseinvalid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La phrase de récupération ne semble pas correcte. Veuillez vérifier les fautes de frappe.`)
};

const ar_recovery_phraseinvalid1 = /** @type {(inputs: Recovery_Phraseinvalid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارة الاسترداد لا تبدو صحيحة. يرجى التحقق من الأخطاء الإملائية.`)
};

/**
* | output |
* | --- |
* | "The recovery phrase doesn’t look right. Please check for typos." |
*
* @param {Recovery_Phraseinvalid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phraseinvalid1 = /** @type {((inputs?: Recovery_Phraseinvalid1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phraseinvalid1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phraseinvalid1(inputs)
	if (locale === "es") return es_recovery_phraseinvalid1(inputs)
	if (locale === "fr") return fr_recovery_phraseinvalid1(inputs)
	return ar_recovery_phraseinvalid1(inputs)
});
export { recovery_phraseinvalid1 as "recovery.phraseInvalid" }