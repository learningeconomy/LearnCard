/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Getstarted2Inputs */

const en_developerportal_guides_hub_getstarted2 = /** @type {(inputs: Developerportal_Guides_Hub_Getstarted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get Started`)
};

const es_developerportal_guides_hub_getstarted2 = /** @type {(inputs: Developerportal_Guides_Hub_Getstarted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comenzar`)
};

const fr_developerportal_guides_hub_getstarted2 = /** @type {(inputs: Developerportal_Guides_Hub_Getstarted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Commencer`)
};

const ar_developerportal_guides_hub_getstarted2 = /** @type {(inputs: Developerportal_Guides_Hub_Getstarted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ`)
};

/**
* | output |
* | --- |
* | "Get Started" |
*
* @param {Developerportal_Guides_Hub_Getstarted2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_getstarted2 = /** @type {((inputs?: Developerportal_Guides_Hub_Getstarted2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Getstarted2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_getstarted2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_getstarted2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_getstarted2(inputs)
	return ar_developerportal_guides_hub_getstarted2(inputs)
});
export { developerportal_guides_hub_getstarted2 as "developerPortal.guides.hub.getStarted" }