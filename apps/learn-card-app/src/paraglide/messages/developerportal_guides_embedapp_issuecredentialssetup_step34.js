/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Step34Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_step34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`3`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_step34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`3`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_step34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`3`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_step34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`3`)
};

/**
* | output |
* | --- |
* | "3" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Step34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_step34 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Step34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_step34(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_step34(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_step34(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_step34(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_step34 as "developerPortal.guides.embedApp.issueCredentialsSetup.step3" }