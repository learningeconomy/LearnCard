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

const fr_sidemenu_newaisession2 = /** @type {(inputs: Sidemenu_Newaisession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle session IA`)
};

const ar_sidemenu_newaisession2 = /** @type {(inputs: Sidemenu_Newaisession2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسة ذكاء اصطناعي جديدة`)
};

/**
* | output |
* | --- |
* | "New AI Session" |
*
* @param {Sidemenu_Newaisession2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_newaisession2 = /** @type {((inputs?: Sidemenu_Newaisession2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Newaisession2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_newaisession2(inputs)
	if (locale === "es") return es_sidemenu_newaisession2(inputs)
	if (locale === "fr") return fr_sidemenu_newaisession2(inputs)
	return ar_sidemenu_newaisession2(inputs)
});
export { sidemenu_newaisession2 as "sidemenu.newAiSession" }