/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Resources_Github_Title1Inputs */

const en_developerportal_guides_hub_resources_github_title1 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Github_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`GitHub`)
};

const es_developerportal_guides_hub_resources_github_title1 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Github_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`GitHub`)
};

const fr_developerportal_guides_hub_resources_github_title1 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Github_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`GitHub`)
};

const ar_developerportal_guides_hub_resources_github_title1 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Github_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`GitHub`)
};

/**
* | output |
* | --- |
* | "GitHub" |
*
* @param {Developerportal_Guides_Hub_Resources_Github_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_resources_github_title1 = /** @type {((inputs?: Developerportal_Guides_Hub_Resources_Github_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Resources_Github_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_resources_github_title1(inputs)
	if (locale === "es") return es_developerportal_guides_hub_resources_github_title1(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_resources_github_title1(inputs)
	return ar_developerportal_guides_hub_resources_github_title1(inputs)
});
export { developerportal_guides_hub_resources_github_title1 as "developerPortal.guides.hub.resources.github.title" }