/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Steps_Choosefeatures3Inputs */

const en_developerportal_guides_embedapp_steps_choosefeatures3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Choosefeatures3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose Features`)
};

const es_developerportal_guides_embedapp_steps_choosefeatures3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Choosefeatures3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elegir Funciones`)
};

const fr_developerportal_guides_embedapp_steps_choosefeatures3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Choosefeatures3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisir les Fonctionnalités`)
};

const ar_developerportal_guides_embedapp_steps_choosefeatures3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Steps_Choosefeatures3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار الميزات`)
};

/**
* | output |
* | --- |
* | "Choose Features" |
*
* @param {Developerportal_Guides_Embedapp_Steps_Choosefeatures3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_steps_choosefeatures3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Steps_Choosefeatures3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Steps_Choosefeatures3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_steps_choosefeatures3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_steps_choosefeatures3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_steps_choosefeatures3(inputs)
	return ar_developerportal_guides_embedapp_steps_choosefeatures3(inputs)
});
export { developerportal_guides_embedapp_steps_choosefeatures3 as "developerPortal.guides.embedApp.steps.chooseFeatures" }