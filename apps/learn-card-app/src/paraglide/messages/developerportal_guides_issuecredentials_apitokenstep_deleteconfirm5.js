/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Guides_Issuecredentials_Apitokenstep_Deleteconfirm5Inputs */

const en_developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Deleteconfirm5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Delete "${i?.name}"?`)
};

const es_developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Deleteconfirm5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Eliminar "${i?.name}"?`)
};

const fr_developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Deleteconfirm5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Supprimer « ${i?.name} » ?`)
};

const ar_developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Deleteconfirm5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حذف "${i?.name}"?`)
};

/**
* | output |
* | --- |
* | "Delete \"{name}\"?" |
*
* @param {Developerportal_Guides_Issuecredentials_Apitokenstep_Deleteconfirm5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5 = /** @type {((inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Deleteconfirm5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Apitokenstep_Deleteconfirm5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5(inputs)
	return ar_developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5(inputs)
});
export { developerportal_guides_issuecredentials_apitokenstep_deleteconfirm5 as "developerPortal.guides.issueCredentials.apiTokenStep.deleteConfirm" }