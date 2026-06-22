/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialfailed5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_credentialfailed5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialfailed5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Credential send failed: ${i?.error}`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_credentialfailed5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialfailed5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al enviar la credencial: ${i?.error}`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_credentialfailed5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialfailed5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Échec de l'envoi du certificat : ${i?.error}`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_credentialfailed5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialfailed5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فشل إرسال المؤهل: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Credential send failed: {error}" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialfailed5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_credentialfailed5 = /** @type {((inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialfailed5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialfailed5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_credentialfailed5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_credentialfailed5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_credentialfailed5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_credentialfailed5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_credentialfailed5 as "developerPortal.guides.issueCredentials.issueVerifyStep.credentialFailed" }