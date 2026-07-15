/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Phraselabel1Inputs */

const en_recovery_method_phraselabel1 = /** @type {(inputs: Recovery_Method_Phraselabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery Phrase`)
};

const es_recovery_method_phraselabel1 = /** @type {(inputs: Recovery_Method_Phraselabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frase de Recuperación`)
};

const fr_recovery_method_phraselabel1 = /** @type {(inputs: Recovery_Method_Phraselabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase de récupération`)
};

const ar_recovery_method_phraselabel1 = /** @type {(inputs: Recovery_Method_Phraselabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارة الاسترداد`)
};

/**
* | output |
* | --- |
* | "Recovery Phrase" |
*
* @param {Recovery_Method_Phraselabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_phraselabel1 = /** @type {((inputs?: Recovery_Method_Phraselabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Phraselabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_phraselabel1(inputs)
	if (locale === "es") return es_recovery_method_phraselabel1(inputs)
	if (locale === "fr") return fr_recovery_method_phraselabel1(inputs)
	return ar_recovery_method_phraselabel1(inputs)
});
export { recovery_method_phraselabel1 as "recovery.method.phraseLabel" }