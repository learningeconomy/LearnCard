/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Viewongithub5Inputs */

const en_developerportal_guides_embedclaim_teststep_viewongithub5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Viewongithub5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View full example on GitHub`)
};

const es_developerportal_guides_embedclaim_teststep_viewongithub5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Viewongithub5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver ejemplo completo en GitHub`)
};

const fr_developerportal_guides_embedclaim_teststep_viewongithub5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Viewongithub5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir l'exemple complet sur GitHub`)
};

const ar_developerportal_guides_embedclaim_teststep_viewongithub5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Viewongithub5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض المثال الكامل على GitHub`)
};

/**
* | output |
* | --- |
* | "View full example on GitHub" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Viewongithub5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_viewongithub5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Viewongithub5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Viewongithub5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_viewongithub5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_viewongithub5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_viewongithub5(inputs)
	return ar_developerportal_guides_embedclaim_teststep_viewongithub5(inputs)
});
export { developerportal_guides_embedclaim_teststep_viewongithub5 as "developerPortal.guides.embedClaim.testStep.viewOnGithub" }