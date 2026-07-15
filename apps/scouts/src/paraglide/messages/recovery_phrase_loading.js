/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrase_LoadingInputs */

const en_recovery_phrase_loading = /** @type {(inputs: Recovery_Phrase_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recovering...`)
};

const es_recovery_phrase_loading = /** @type {(inputs: Recovery_Phrase_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperando...`)
};

const fr_recovery_phrase_loading = /** @type {(inputs: Recovery_Phrase_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération en cours...`)
};

const ar_recovery_phrase_loading = /** @type {(inputs: Recovery_Phrase_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الاسترداد...`)
};

/**
* | output |
* | --- |
* | "Recovering..." |
*
* @param {Recovery_Phrase_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrase_loading = /** @type {((inputs?: Recovery_Phrase_LoadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrase_LoadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrase_loading(inputs)
	if (locale === "es") return es_recovery_phrase_loading(inputs)
	if (locale === "fr") return fr_recovery_phrase_loading(inputs)
	return ar_recovery_phrase_loading(inputs)
});
export { recovery_phrase_loading as "recovery.phrase.loading" }