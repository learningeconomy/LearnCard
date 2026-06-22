/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Apitokenstep_Statuswarning5Inputs */

const en_developerportal_guides_issuecredentials_apitokenstep_statuswarning5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statuswarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No API tokens found`)
};

const es_developerportal_guides_issuecredentials_apitokenstep_statuswarning5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statuswarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron tokens de API`)
};

const fr_developerportal_guides_issuecredentials_apitokenstep_statuswarning5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statuswarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun jeton API trouvé`)
};

const ar_developerportal_guides_issuecredentials_apitokenstep_statuswarning5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Statuswarning5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على رموز API`)
};

/**
* | output |
* | --- |
* | "No API tokens found" |
*
* @param {Developerportal_Guides_Issuecredentials_Apitokenstep_Statuswarning5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_apitokenstep_statuswarning5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Apitokenstep_Statuswarning5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Apitokenstep_Statuswarning5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_apitokenstep_statuswarning5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_apitokenstep_statuswarning5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_apitokenstep_statuswarning5(inputs)
	return ar_developerportal_guides_issuecredentials_apitokenstep_statuswarning5(inputs)
});
export { developerportal_guides_issuecredentials_apitokenstep_statuswarning5 as "developerPortal.guides.issueCredentials.apiTokenStep.statusWarning" }