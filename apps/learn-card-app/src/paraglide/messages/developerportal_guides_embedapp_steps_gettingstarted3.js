/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Steps_Gettingstarted3Inputs */

const en_developerportal_guides_embedapp_steps_gettingstarted3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Gettingstarted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Getting Started`)
};

const es_developerportal_guides_embedapp_steps_gettingstarted3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Gettingstarted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Primeros Pasos`)
};

const fr_developerportal_guides_embedapp_steps_gettingstarted3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Gettingstarted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour Commencer`)
};

const ar_developerportal_guides_embedapp_steps_gettingstarted3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Gettingstarted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ`)
};

/**
* | output |
* | --- |
* | "Getting Started" |
*
* @param {Developerportal_Guides_Embedapp_Steps_Gettingstarted3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_steps_gettingstarted3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Steps_Gettingstarted3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Steps_Gettingstarted3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_steps_gettingstarted3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_steps_gettingstarted3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_steps_gettingstarted3(inputs)
	return ar_developerportal_guides_embedapp_steps_gettingstarted3(inputs)
});
export { developerportal_guides_embedapp_steps_gettingstarted3 as "developerPortal.guides.embedApp.steps.gettingStarted" }