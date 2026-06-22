/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Createcontractstep_Copyuributton6Inputs */

const en_developerportal_guides_consentflow_createcontractstep_copyuributton6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Copyuributton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy URI`)
};

const es_developerportal_guides_consentflow_createcontractstep_copyuributton6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Copyuributton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar URI`)
};

const fr_developerportal_guides_consentflow_createcontractstep_copyuributton6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Copyuributton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier l'URI`)
};

const ar_developerportal_guides_consentflow_createcontractstep_copyuributton6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Copyuributton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ URI`)
};

/**
* | output |
* | --- |
* | "Copy URI" |
*
* @param {Developerportal_Guides_Consentflow_Createcontractstep_Copyuributton6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_createcontractstep_copyuributton6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Createcontractstep_Copyuributton6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Createcontractstep_Copyuributton6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_createcontractstep_copyuributton6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_createcontractstep_copyuributton6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_createcontractstep_copyuributton6(inputs)
	return ar_developerportal_guides_consentflow_createcontractstep_copyuributton6(inputs)
});
export { developerportal_guides_consentflow_createcontractstep_copyuributton6 as "developerPortal.guides.consentFlow.createContractStep.copyUriButton" }