/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Tab_PhraseInputs */

const en_recovery_tab_phrase = /** @type {(inputs: Recovery_Tab_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase`)
};

const es_recovery_tab_phrase = /** @type {(inputs: Recovery_Tab_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frase`)
};

const fr_recovery_tab_phrase = /** @type {(inputs: Recovery_Tab_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase`)
};

const ar_recovery_tab_phrase = /** @type {(inputs: Recovery_Tab_PhraseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارة`)
};

/**
* | output |
* | --- |
* | "Phrase" |
*
* @param {Recovery_Tab_PhraseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_tab_phrase = /** @type {((inputs?: Recovery_Tab_PhraseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Tab_PhraseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_tab_phrase(inputs)
	if (locale === "es") return es_recovery_tab_phrase(inputs)
	if (locale === "fr") return fr_recovery_tab_phrase(inputs)
	return ar_recovery_tab_phrase(inputs)
});
export { recovery_tab_phrase as "recovery.tab.phrase" }