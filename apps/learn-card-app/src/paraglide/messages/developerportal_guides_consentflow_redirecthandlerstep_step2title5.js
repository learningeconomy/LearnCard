/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2title5Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_step2title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Handle the Callback`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_step2title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manejar la Devolución`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_step2title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer le Rappel`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_step2title5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معالجة الاستدعاء`)
};

/**
* | output |
* | --- |
* | "Handle the Callback" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2title5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_step2title5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2title5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2title5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_step2title5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_step2title5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_step2title5(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_step2title5(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_step2title5 as "developerPortal.guides.consentFlow.redirectHandlerStep.step2Title" }