/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Developerportal_Guides_Issuecredentials_Apitokenstep_Createdlabel5Inputs */

const en_developerportal_guides_issuecredentials_apitokenstep_createdlabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Createdlabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Created ${i?.date}`)
};

const es_developerportal_guides_issuecredentials_apitokenstep_createdlabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Createdlabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creado ${i?.date}`)
};

const fr_developerportal_guides_issuecredentials_apitokenstep_createdlabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Createdlabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créé le ${i?.date}`)
};

const ar_developerportal_guides_issuecredentials_apitokenstep_createdlabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Createdlabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم الإنشاء ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Created {date}" |
*
* @param {Developerportal_Guides_Issuecredentials_Apitokenstep_Createdlabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_apitokenstep_createdlabel5 = /** @type {((inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Createdlabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Apitokenstep_Createdlabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_apitokenstep_createdlabel5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_apitokenstep_createdlabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_apitokenstep_createdlabel5(inputs)
	return ar_developerportal_guides_issuecredentials_apitokenstep_createdlabel5(inputs)
});
export { developerportal_guides_issuecredentials_apitokenstep_createdlabel5 as "developerPortal.guides.issueCredentials.apiTokenStep.createdLabel" }