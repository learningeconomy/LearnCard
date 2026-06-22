/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ index: NonNullable<unknown> }} Developerportal_Guides_Embedclaim_Teststep_Templatelabel4Inputs */

const en_developerportal_guides_embedclaim_teststep_templatelabel4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Templatelabel4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Template ${i?.index}`)
};

const es_developerportal_guides_embedclaim_teststep_templatelabel4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Templatelabel4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Plantilla ${i?.index}`)
};

const fr_developerportal_guides_embedclaim_teststep_templatelabel4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Templatelabel4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Modèle ${i?.index}`)
};

const ar_developerportal_guides_embedclaim_teststep_templatelabel4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Templatelabel4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`قالب ${i?.index}`)
};

/**
* | output |
* | --- |
* | "Template {index}" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Templatelabel4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_templatelabel4 = /** @type {((inputs: Developerportal_Guides_Embedclaim_Teststep_Templatelabel4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Templatelabel4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_templatelabel4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_templatelabel4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_templatelabel4(inputs)
	return ar_developerportal_guides_embedclaim_teststep_templatelabel4(inputs)
});
export { developerportal_guides_embedclaim_teststep_templatelabel4 as "developerPortal.guides.embedClaim.testStep.templateLabel" }