/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Description4Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your template to issue credentials via API. Select a template and recipient, then run the generated code in your application.`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your template to issue credentials via API. Select a template and recipient, then run the generated code in your application.`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your template to issue credentials via API. Select a template and recipient, then run the generated code in your application.`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_description4 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your template to issue credentials via API. Select a template and recipient, then run the generated code in your application.`)
};

/**
* | output |
* | --- |
* | "Use your template to issue credentials via API. Select a template and recipient, then run the generated code in your application." |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_description4 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_description4(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_description4(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_description4 as "developerPortal.guides.issueCredentials.issueVerifyStep.description" }