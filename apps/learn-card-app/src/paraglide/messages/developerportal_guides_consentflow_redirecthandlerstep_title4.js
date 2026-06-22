/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Title4Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set Up Your Redirect Handler`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurar Tu Manejador de Redirección`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer Votre Gestionnaire de Redirection`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد معالج إعادة التوجيه الخاص بك`)
};

/**
* | output |
* | --- |
* | "Set Up Your Redirect Handler" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_title4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_title4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_title4(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_title4(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_title4 as "developerPortal.guides.consentFlow.redirectHandlerStep.title" }