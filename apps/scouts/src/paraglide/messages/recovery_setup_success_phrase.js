/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Success_PhraseInputs */

const en_recovery_setup_success_phrase = /** @type {(inputs: Recovery_Setup_Success_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery phrase saved! Keep it somewhere safe.`)
};

const es_recovery_setup_success_phrase = /** @type {(inputs: Recovery_Setup_Success_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Frase de recuperación guardada! Mantenla en un lugar seguro.`)
};

const fr_recovery_setup_success_phrase = /** @type {(inputs: Recovery_Setup_Success_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase de récupération sauvegardée ! Conservez-la dans un endroit sûr.`)
};

const ar_recovery_setup_success_phrase = /** @type {(inputs: Recovery_Setup_Success_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovery phrase saved! Keep it somewhere safe.`)
};

/**
* | output |
* | --- |
* | "Recovery phrase saved! Keep it somewhere safe." |
*
* @param {Recovery_Setup_Success_PhraseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_success_phrase = /** @type {((inputs?: Recovery_Setup_Success_PhraseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Success_PhraseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_success_phrase(inputs)
	if (locale === "es") return es_recovery_setup_success_phrase(inputs)
	if (locale === "fr") return fr_recovery_setup_success_phrase(inputs)
	return ar_recovery_setup_success_phrase(inputs)
});
export { recovery_setup_success_phrase as "recovery.setup.success.phrase" }