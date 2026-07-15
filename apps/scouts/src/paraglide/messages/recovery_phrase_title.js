/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrase_TitleInputs */

const en_recovery_phrase_title = /** @type {(inputs: Recovery_Phrase_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery Phrase`)
};

const es_recovery_phrase_title = /** @type {(inputs: Recovery_Phrase_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frase de Recuperación`)
};

const fr_recovery_phrase_title = /** @type {(inputs: Recovery_Phrase_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase de récupération`)
};

const ar_recovery_phrase_title = /** @type {(inputs: Recovery_Phrase_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارة الاسترداد`)
};

/**
* | output |
* | --- |
* | "Recovery Phrase" |
*
* @param {Recovery_Phrase_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrase_title = /** @type {((inputs?: Recovery_Phrase_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrase_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrase_title(inputs)
	if (locale === "es") return es_recovery_phrase_title(inputs)
	if (locale === "fr") return fr_recovery_phrase_title(inputs)
	return ar_recovery_phrase_title(inputs)
});
export { recovery_phrase_title as "recovery.phrase.title" }