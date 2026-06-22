/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Step1desc5Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_step1desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step1desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a button that redirects users to the consent flow:`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_step1desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step1desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un botón que redirija a los usuarios al flujo de consentimiento:`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_step1desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step1desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez un bouton qui redirige les utilisateurs vers le flux de consentement :`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_step1desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step1desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ زراً يعيد توجيه المستخدمين إلى تدفق الموافقة:`)
};

/**
* | output |
* | --- |
* | "Create a button that redirects users to the consent flow:" |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Step1desc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_step1desc5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step1desc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Step1desc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_step1desc5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_step1desc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_step1desc5(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_step1desc5(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_step1desc5 as "developerPortal.guides.consentFlow.redirectHandlerStep.step1Desc" }