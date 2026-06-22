/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Heading1Inputs */

const en_developerportal_guides_hub_heading1 = /** @type {(inputs: Developerportal_Guides_Hub_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build Your Integration`)
};

const es_developerportal_guides_hub_heading1 = /** @type {(inputs: Developerportal_Guides_Hub_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construye tu Integración`)
};

const fr_developerportal_guides_hub_heading1 = /** @type {(inputs: Developerportal_Guides_Hub_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construisez Votre Intégration`)
};

const ar_developerportal_guides_hub_heading1 = /** @type {(inputs: Developerportal_Guides_Hub_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابنِ التكامل الخاص بك`)
};

/**
* | output |
* | --- |
* | "Build Your Integration" |
*
* @param {Developerportal_Guides_Hub_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_heading1 = /** @type {((inputs?: Developerportal_Guides_Hub_Heading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Heading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_heading1(inputs)
	if (locale === "es") return es_developerportal_guides_hub_heading1(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_heading1(inputs)
	return ar_developerportal_guides_hub_heading1(inputs)
});
export { developerportal_guides_hub_heading1 as "developerPortal.guides.hub.heading" }