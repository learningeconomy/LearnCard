/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialtemplate5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Template`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantilla de Credencial`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle de Certificat`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قالب المؤهل`)
};

/**
* | output |
* | --- |
* | "Credential Template" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialtemplate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialtemplate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Credentialtemplate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_credentialtemplate5 as "developerPortal.guides.issueCredentials.issueVerifyStep.credentialTemplate" }