/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckerror6Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckerror6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to check credentials. Please try again.`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckerror6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al verificar las credenciales. Inténtalo de nuevo.`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckerror6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la vérification des certificats. Veuillez réessayer.`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckerror6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل التحقق من المؤهلات. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to check credentials. Please try again." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckerror6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckerror6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialcheckerror6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_credentialcheckerror6 as "developerPortal.guides.issueCredentials.issueVerifyStep.credentialCheckError" }