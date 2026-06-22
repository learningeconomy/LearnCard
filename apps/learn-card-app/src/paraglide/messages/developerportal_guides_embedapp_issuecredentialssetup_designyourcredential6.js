/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Designyourcredential6Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Designyourcredential6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Design Your Credential`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Designyourcredential6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diseña Tu Credencial`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Designyourcredential6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Concevoir Votre Titre`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Designyourcredential6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصميم شهادتك`)
};

/**
* | output |
* | --- |
* | "Design Your Credential" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Designyourcredential6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Designyourcredential6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Designyourcredential6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_designyourcredential6 as "developerPortal.guides.embedApp.issueCredentialsSetup.designYourCredential" }