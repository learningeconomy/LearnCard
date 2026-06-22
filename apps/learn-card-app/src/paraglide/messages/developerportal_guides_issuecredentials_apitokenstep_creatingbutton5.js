/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Apitokenstep_Creatingbutton5Inputs */

const en_developerportal_guides_issuecredentials_apitokenstep_creatingbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Creatingbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating...`)
};

const es_developerportal_guides_issuecredentials_apitokenstep_creatingbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Creatingbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando...`)
};

const fr_developerportal_guides_issuecredentials_apitokenstep_creatingbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Creatingbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création…`)
};

const ar_developerportal_guides_issuecredentials_apitokenstep_creatingbutton5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Creatingbutton5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإنشاء…`)
};

/**
* | output |
* | --- |
* | "Creating..." |
*
* @param {Developerportal_Guides_Issuecredentials_Apitokenstep_Creatingbutton5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_apitokenstep_creatingbutton5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Apitokenstep_Creatingbutton5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Apitokenstep_Creatingbutton5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_apitokenstep_creatingbutton5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_apitokenstep_creatingbutton5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_apitokenstep_creatingbutton5(inputs)
	return ar_developerportal_guides_issuecredentials_apitokenstep_creatingbutton5(inputs)
});
export { developerportal_guides_issuecredentials_apitokenstep_creatingbutton5 as "developerPortal.guides.issueCredentials.apiTokenStep.creatingButton" }