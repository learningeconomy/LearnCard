/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Existingappdesc6Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_existingappdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Existingappdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app will run inside an iframe in the LearnCard wallet. Enter your URL and we'll check if it's ready for embedding.`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_existingappdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Existingappdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app will run inside an iframe in the LearnCard wallet. Enter your URL and we'll check if it's ready for embedding.`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_existingappdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Existingappdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app will run inside an iframe in the LearnCard wallet. Enter your URL and we'll check if it's ready for embedding.`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_existingappdesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Existingappdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app will run inside an iframe in the LearnCard wallet. Enter your URL and we'll check if it's ready for embedding.`)
};

/**
* | output |
* | --- |
* | "Your app will run inside an iframe in the LearnCard wallet. Enter your URL and we'll check if it's ready for embedding." |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Existingappdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_existingappdesc6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Existingappdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Existingappdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_existingappdesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_existingappdesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_existingappdesc6(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_existingappdesc6(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_existingappdesc6 as "developerPortal.guides.embedApp.setupWebsiteStep.existingAppDesc" }