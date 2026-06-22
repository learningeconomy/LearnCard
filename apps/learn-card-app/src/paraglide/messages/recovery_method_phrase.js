/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_PhraseInputs */

const en_recovery_method_phrase = /** @type {(inputs: Recovery_Method_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery Phrase`)
};

const es_recovery_method_phrase = /** @type {(inputs: Recovery_Method_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frase de recuperación`)
};

const fr_recovery_method_phrase = /** @type {(inputs: Recovery_Method_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase de récupération`)
};

const ar_recovery_method_phrase = /** @type {(inputs: Recovery_Method_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارة الاستعادة`)
};

/**
* | output |
* | --- |
* | "Recovery Phrase" |
*
* @param {Recovery_Method_PhraseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_phrase = /** @type {((inputs?: Recovery_Method_PhraseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_PhraseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_phrase(inputs)
	if (locale === "es") return es_recovery_method_phrase(inputs)
	if (locale === "fr") return fr_recovery_method_phrase(inputs)
	return ar_recovery_method_phrase(inputs)
});
export { recovery_method_phrase as "recovery.method.phrase" }