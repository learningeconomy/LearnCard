/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Apisetupstep_Statuswarninghint6Inputs */

const en_developerportal_guides_consentflow_apisetupstep_statuswarninghint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statuswarninghint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create one to continue`)
};

const es_developerportal_guides_consentflow_apisetupstep_statuswarninghint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statuswarninghint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea uno para continuar`)
};

const fr_developerportal_guides_consentflow_apisetupstep_statuswarninghint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statuswarninghint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez-en un pour continuer`)
};

const ar_developerportal_guides_consentflow_apisetupstep_statuswarninghint6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Apisetupstep_Statuswarninghint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ واحداً للمتابعة`)
};

/**
* | output |
* | --- |
* | "Create one to continue" |
*
* @param {Developerportal_Guides_Consentflow_Apisetupstep_Statuswarninghint6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_apisetupstep_statuswarninghint6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Apisetupstep_Statuswarninghint6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Apisetupstep_Statuswarninghint6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_apisetupstep_statuswarninghint6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_apisetupstep_statuswarninghint6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_apisetupstep_statuswarninghint6(inputs)
	return ar_developerportal_guides_consentflow_apisetupstep_statuswarninghint6(inputs)
});
export { developerportal_guides_consentflow_apisetupstep_statuswarninghint6 as "developerPortal.guides.consentFlow.apiSetupStep.statusWarningHint" }