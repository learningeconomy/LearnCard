/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Checking4Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_checking4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Checking4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking signing authority...`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_checking4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Checking4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificaring signing authority...`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_checking4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Checking4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiering signing authority...`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_checking4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Checking4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحققing signing authority...`)
};

/**
* | output |
* | --- |
* | "Checking signing authority..." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Checking4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_checking4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Checking4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Checking4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_checking4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_checking4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_checking4(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_checking4(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_checking4 as "developerPortal.guides.embedApp.issueCredentialsSetup.checking" }