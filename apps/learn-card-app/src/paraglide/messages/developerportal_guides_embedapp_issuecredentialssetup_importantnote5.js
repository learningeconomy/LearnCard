/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Importantnote5Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_importantnote5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Importantnote5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important: Step 3 (issuing) must happen on your server with your API key to sign the credential properly.`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_importantnote5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Importantnote5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importante: Step 3 (issuing) must happen on your server with your API key to sign the credential properly.`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_importantnote5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Importantnote5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important: Step 3 (issuing) must happen on your server with your API key to sign the credential properly.`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_importantnote5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Importantnote5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important: Step 3 (issuing) must happen on your server with your API key to sign the credential properly.`)
};

/**
* | output |
* | --- |
* | "Important: Step 3 (issuing) must happen on your server with your API key to sign the credential properly." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Importantnote5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_importantnote5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Importantnote5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Importantnote5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_importantnote5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_importantnote5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_importantnote5(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_importantnote5(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_importantnote5 as "developerPortal.guides.embedApp.issueCredentialsSetup.importantNote" }