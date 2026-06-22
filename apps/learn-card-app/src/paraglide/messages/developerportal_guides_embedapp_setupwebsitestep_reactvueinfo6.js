/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Reactvueinfo6Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Reactvueinfo6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When you deploy, you'll need to configure your hosting provider to add these headers.`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Reactvueinfo6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When you deploy, you'll need to configure your hosting provider to add these headers.`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Reactvueinfo6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When you deploy, you'll need to configure your hosting provider to add these headers.`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Reactvueinfo6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When you deploy, you'll need to configure your hosting provider to add these headers.`)
};

/**
* | output |
* | --- |
* | "When you deploy, you'll need to configure your hosting provider to add these headers." |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Reactvueinfo6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Reactvueinfo6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Reactvueinfo6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_reactvueinfo6 as "developerPortal.guides.embedApp.setupWebsiteStep.reactVueInfo" }