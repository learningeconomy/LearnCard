/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Step44Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_step44 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`4`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_step44 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`4`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_step44 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`4`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_step44 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step44Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`4`)
};

/**
* | output |
* | --- |
* | "4" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Step44Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_step44 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Step44Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Step44Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_step44(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_step44(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_step44(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_step44(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_step44 as "developerPortal.guides.embedApp.issueCredentialsSetup.step4" }