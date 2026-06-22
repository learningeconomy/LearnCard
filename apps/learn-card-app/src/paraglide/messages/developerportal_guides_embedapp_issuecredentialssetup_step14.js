/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Step14Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_step14 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_step14 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_step14 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_step14 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1`)
};

/**
* | output |
* | --- |
* | "1" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Step14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_step14 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Step14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_step14(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_step14(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_step14(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_step14(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_step14 as "developerPortal.guides.embedApp.issueCredentialsSetup.step1" }