/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Returns5Inputs */

const en_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Returns5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Result of the issuance`)
};

const es_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Returns5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Result of the issuance`)
};

const fr_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Returns5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Result of the issuance`)
};

const ar_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Returns5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Result of the issuance`)
};

/**
* | output |
* | --- |
* | "Result of the issuance" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Returns5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Returns5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Initiatetemplateissue_Returns5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_initiatetemplateissue_returns5 as "developerPortal.guides.embedApp.apiReference.methods.initiateTemplateIssue.returns" }