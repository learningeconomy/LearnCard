/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Steps_Redirecthandler3Inputs */

const en_developerportal_guides_consentflow_steps_redirecthandler3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Steps_Redirecthandler3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Redirect Handler`)
};

const es_developerportal_guides_consentflow_steps_redirecthandler3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Steps_Redirecthandler3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manejador de Redirección`)
};

const fr_developerportal_guides_consentflow_steps_redirecthandler3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Steps_Redirecthandler3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionnaire de Redirection`)
};

const ar_developerportal_guides_consentflow_steps_redirecthandler3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Steps_Redirecthandler3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معالج إعادة التوجيه`)
};

/**
* | output |
* | --- |
* | "Redirect Handler" |
*
* @param {Developerportal_Guides_Consentflow_Steps_Redirecthandler3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_steps_redirecthandler3 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Steps_Redirecthandler3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Steps_Redirecthandler3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_steps_redirecthandler3(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_steps_redirecthandler3(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_steps_redirecthandler3(inputs)
	return ar_developerportal_guides_consentflow_steps_redirecthandler3(inputs)
});
export { developerportal_guides_consentflow_steps_redirecthandler3 as "developerPortal.guides.consentFlow.steps.redirectHandler" }