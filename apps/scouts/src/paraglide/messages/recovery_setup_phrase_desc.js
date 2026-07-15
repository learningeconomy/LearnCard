/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_DescInputs */

const en_recovery_setup_phrase_desc = /** @type {(inputs: Recovery_Setup_Phrase_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate a 25-word phrase that can restore your account from anywhere. Write it down and keep it safe.`)
};

const es_recovery_setup_phrase_desc = /** @type {(inputs: Recovery_Setup_Phrase_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Genera una frase de 25 palabras que pueda restaurar tu cuenta desde cualquier lugar. Escríbela y guárdala en un lugar seguro.`)
};

const fr_recovery_setup_phrase_desc = /** @type {(inputs: Recovery_Setup_Phrase_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générez une phrase de 25 mots qui peut restaurer votre compte depuis n'importe où. Notez-la et conservez-la en lieu sûr.`)
};

const ar_recovery_setup_phrase_desc = /** @type {(inputs: Recovery_Setup_Phrase_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate a 25-word phrase that can restore your account from anywhere. Write it down and keep it safe.`)
};

/**
* | output |
* | --- |
* | "Generate a 25-word phrase that can restore your account from anywhere. Write it down and keep it safe." |
*
* @param {Recovery_Setup_Phrase_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_desc = /** @type {((inputs?: Recovery_Setup_Phrase_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_desc(inputs)
	if (locale === "es") return es_recovery_setup_phrase_desc(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_desc(inputs)
	return ar_recovery_setup_phrase_desc(inputs)
});
export { recovery_setup_phrase_desc as "recovery.setup.phrase.desc" }