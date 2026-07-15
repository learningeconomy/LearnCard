/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrase_DescInputs */

const en_recovery_phrase_desc = /** @type {(inputs: Recovery_Phrase_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your 25-word recovery phrase, separated by spaces.`)
};

const es_recovery_phrase_desc = /** @type {(inputs: Recovery_Phrase_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa tu frase de recuperación de 25 palabras, separadas por espacios.`)
};

const fr_recovery_phrase_desc = /** @type {(inputs: Recovery_Phrase_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez votre phrase de récupération de 25 mots, séparés par des espaces.`)
};

const ar_recovery_phrase_desc = /** @type {(inputs: Recovery_Phrase_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your 25-word recovery phrase, separated by spaces.`)
};

/**
* | output |
* | --- |
* | "Enter your 25-word recovery phrase, separated by spaces." |
*
* @param {Recovery_Phrase_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrase_desc = /** @type {((inputs?: Recovery_Phrase_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrase_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrase_desc(inputs)
	if (locale === "es") return es_recovery_phrase_desc(inputs)
	if (locale === "fr") return fr_recovery_phrase_desc(inputs)
	return ar_recovery_phrase_desc(inputs)
});
export { recovery_phrase_desc as "recovery.phrase.desc" }