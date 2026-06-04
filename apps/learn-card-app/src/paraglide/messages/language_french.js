/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Language_FrenchInputs */

const en_language_french = /** @type {(inputs: Language_FrenchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Français`)
};

const es_language_french = /** @type {(inputs: Language_FrenchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Français`)
};

const de_language_french = /** @type {(inputs: Language_FrenchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Français`)
};

const ar_language_french = /** @type {(inputs: Language_FrenchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Français`)
};

const fr_language_french = /** @type {(inputs: Language_FrenchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Français`)
};

const ko_language_french = /** @type {(inputs: Language_FrenchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Français`)
};

/**
* | output |
* | --- |
* | "Français" |
*
* @param {Language_FrenchInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const language_french = /** @type {((inputs?: Language_FrenchInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_FrenchInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_language_french(inputs)
	if (locale === "es") return es_language_french(inputs)
	if (locale === "de") return de_language_french(inputs)
	if (locale === "ar") return ar_language_french(inputs)
	if (locale === "fr") return fr_language_french(inputs)
	return ko_language_french(inputs)
});
export { language_french as "language.french" }