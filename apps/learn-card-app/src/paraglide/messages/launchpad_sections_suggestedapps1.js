/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Sections_Suggestedapps1Inputs */

const en_launchpad_sections_suggestedapps1 = /** @type {(inputs: Launchpad_Sections_Suggestedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suggested Apps`)
};

const es_launchpad_sections_suggestedapps1 = /** @type {(inputs: Launchpad_Sections_Suggestedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aplicaciones sugeridas`)
};

const de_launchpad_sections_suggestedapps1 = /** @type {(inputs: Launchpad_Sections_Suggestedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vorgeschlagene Apps`)
};

const ar_launchpad_sections_suggestedapps1 = /** @type {(inputs: Launchpad_Sections_Suggestedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقات مقترحة`)
};

const fr_launchpad_sections_suggestedapps1 = /** @type {(inputs: Launchpad_Sections_Suggestedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Applications suggérées`)
};

const ko_launchpad_sections_suggestedapps1 = /** @type {(inputs: Launchpad_Sections_Suggestedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`추천 앱`)
};

/**
* | output |
* | --- |
* | "Suggested Apps" |
*
* @param {Launchpad_Sections_Suggestedapps1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_sections_suggestedapps1 = /** @type {((inputs?: Launchpad_Sections_Suggestedapps1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Sections_Suggestedapps1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_sections_suggestedapps1(inputs)
	if (locale === "es") return es_launchpad_sections_suggestedapps1(inputs)
	if (locale === "de") return de_launchpad_sections_suggestedapps1(inputs)
	if (locale === "ar") return ar_launchpad_sections_suggestedapps1(inputs)
	if (locale === "fr") return fr_launchpad_sections_suggestedapps1(inputs)
	return ko_launchpad_sections_suggestedapps1(inputs)
});
export { launchpad_sections_suggestedapps1 as "launchpad.sections.suggestedApps" }