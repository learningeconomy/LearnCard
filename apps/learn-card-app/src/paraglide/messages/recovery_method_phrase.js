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

const de_recovery_method_phrase = /** @type {(inputs: Recovery_Method_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wiederherstellungsphrase`)
};

const ar_recovery_method_phrase = /** @type {(inputs: Recovery_Method_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارة الاستعادة`)
};

const fr_recovery_method_phrase = /** @type {(inputs: Recovery_Method_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase de récupération`)
};

const ko_recovery_method_phrase = /** @type {(inputs: Recovery_Method_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`복구 구문`)
};

/**
* | output |
* | --- |
* | "Recovery Phrase" |
*
* @param {Recovery_Method_PhraseInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_method_phrase = /** @type {((inputs?: Recovery_Method_PhraseInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_PhraseInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_phrase(inputs)
	if (locale === "es") return es_recovery_method_phrase(inputs)
	if (locale === "de") return de_recovery_method_phrase(inputs)
	if (locale === "ar") return ar_recovery_method_phrase(inputs)
	if (locale === "fr") return fr_recovery_method_phrase(inputs)
	return ko_recovery_method_phrase(inputs)
});
export { recovery_method_phrase as "recovery.method.phrase" }