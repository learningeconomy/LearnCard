/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Recipienthint5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_recipienthint5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipienthint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(email, DID, or profile ID)`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_recipienthint5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipienthint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(correo electrónico, DID o ID de perfil)`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_recipienthint5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipienthint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(email, DID ou ID de profil)`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_recipienthint5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipienthint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(بريد إلكتروني، DID، أو معرف ملف شخصي)`)
};

/**
* | output |
* | --- |
* | "(email, DID, or profile ID)" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Recipienthint5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_recipienthint5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Recipienthint5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Recipienthint5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_recipienthint5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_recipienthint5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_recipienthint5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_recipienthint5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_recipienthint5 as "developerPortal.guides.issueCredentials.issueVerifyStep.recipientHint" }