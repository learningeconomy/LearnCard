/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsent5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_credentialsent5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsent5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential sent successfully!`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_credentialsent5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsent5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial enviada exitosamente!`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_credentialsent5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsent5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificat envoyé avec succès !`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_credentialsent5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsent5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال المؤهل بنجاح!`)
};

/**
* | output |
* | --- |
* | "Credential sent successfully!" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsent5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_credentialsent5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsent5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialsent5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_credentialsent5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_credentialsent5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_credentialsent5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_credentialsent5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_credentialsent5 as "developerPortal.guides.issueCredentials.issueVerifyStep.credentialSent" }