/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Readytogolive6Inputs */

const en_developerportal_guides_embedclaim_teststep_readytogolive6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Readytogolive6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to go live!`)
};

const es_developerportal_guides_embedclaim_teststep_readytogolive6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Readytogolive6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Listo para publicar!`)
};

const fr_developerportal_guides_embedclaim_teststep_readytogolive6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Readytogolive6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt pour la mise en ligne !`)
};

const ar_developerportal_guides_embedclaim_teststep_readytogolive6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Readytogolive6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاهز للنشر المباشر!`)
};

/**
* | output |
* | --- |
* | "Ready to go live!" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Readytogolive6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_readytogolive6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Readytogolive6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Readytogolive6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_readytogolive6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_readytogolive6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_readytogolive6(inputs)
	return ar_developerportal_guides_embedclaim_teststep_readytogolive6(inputs)
});
export { developerportal_guides_embedclaim_teststep_readytogolive6 as "developerPortal.guides.embedClaim.testStep.readyToGoLive" }