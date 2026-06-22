/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Recommended4Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_recommended4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recommended4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommended`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_recommended4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recommended4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recomendado`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_recommended4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recommended4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandé`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_recommended4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recommended4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موصى به`)
};

/**
* | output |
* | --- |
* | "Recommended" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Recommended4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_recommended4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recommended4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Recommended4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_recommended4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_recommended4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_recommended4(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_recommended4(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_recommended4 as "developerPortal.guides.embedApp.issueCredentialsSetup.recommended" }