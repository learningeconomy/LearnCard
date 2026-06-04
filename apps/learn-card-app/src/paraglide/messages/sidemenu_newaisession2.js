/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Newaisession2Inputs */

const en_sidemenu_newaisession2 = /** @type {(inputs: Sidemenu_Newaisession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New AI Session`)
};

const es_sidemenu_newaisession2 = /** @type {(inputs: Sidemenu_Newaisession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva sesión de IA`)
};

const de_sidemenu_newaisession2 = /** @type {(inputs: Sidemenu_Newaisession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue KI-Sitzung`)
};

const ar_sidemenu_newaisession2 = /** @type {(inputs: Sidemenu_Newaisession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسة ذكاء اصطناعي جديدة`)
};

const fr_sidemenu_newaisession2 = /** @type {(inputs: Sidemenu_Newaisession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle session IA`)
};

const ko_sidemenu_newaisession2 = /** @type {(inputs: Sidemenu_Newaisession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 AI 세션`)
};

/**
* | output |
* | --- |
* | "New AI Session" |
*
* @param {Sidemenu_Newaisession2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_newaisession2 = /** @type {((inputs?: Sidemenu_Newaisession2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Newaisession2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_newaisession2(inputs)
	if (locale === "es") return es_sidemenu_newaisession2(inputs)
	if (locale === "de") return de_sidemenu_newaisession2(inputs)
	if (locale === "ar") return ar_sidemenu_newaisession2(inputs)
	if (locale === "fr") return fr_sidemenu_newaisession2(inputs)
	return ko_sidemenu_newaisession2(inputs)
});
export { sidemenu_newaisession2 as "sidemenu.newAiSession" }