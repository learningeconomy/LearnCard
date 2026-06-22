/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Testintegrationdesc5Inputs */

const en_developerportal_guides_embedapp_yourapp_testintegrationdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Testintegrationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app and validate partner-connect API calls`)
};

const es_developerportal_guides_embedapp_yourapp_testintegrationdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Testintegrationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app and validate partner-connect API calls`)
};

const fr_developerportal_guides_embedapp_yourapp_testintegrationdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Testintegrationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app and validate partner-connect API calls`)
};

const ar_developerportal_guides_embedapp_yourapp_testintegrationdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Testintegrationdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview your app and validate partner-connect API calls`)
};

/**
* | output |
* | --- |
* | "Preview your app and validate partner-connect API calls" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Testintegrationdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_testintegrationdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Testintegrationdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Testintegrationdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_testintegrationdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_testintegrationdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_testintegrationdesc5(inputs)
	return ar_developerportal_guides_embedapp_yourapp_testintegrationdesc5(inputs)
});
export { developerportal_guides_embedapp_yourapp_testintegrationdesc5 as "developerPortal.guides.embedApp.yourApp.testIntegrationDesc" }