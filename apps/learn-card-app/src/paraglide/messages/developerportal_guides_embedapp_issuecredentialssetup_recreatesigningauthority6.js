/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Recreatesigningauthority6Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recreatesigningauthority6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recreate Signing Authority`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recreatesigningauthority6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recrear Autoridad de Firma`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recreatesigningauthority6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recréer l'Autorité de Signature`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recreatesigningauthority6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة إنشاء سلطة التوقيع`)
};

/**
* | output |
* | --- |
* | "Recreate Signing Authority" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Recreatesigningauthority6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Recreatesigningauthority6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Recreatesigningauthority6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_recreatesigningauthority6 as "developerPortal.guides.embedApp.issueCredentialsSetup.recreateSigningAuthority" }