/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Step24Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_step24 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_step24 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_step24 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_step24 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`2`)
};

/**
* | output |
* | --- |
* | "2" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Step24Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_step24 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step24Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Step24Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_step24(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_step24(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_step24(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_step24(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_step24 as "developerPortal.guides.embedApp.issueCredentialsSetup.step2" }