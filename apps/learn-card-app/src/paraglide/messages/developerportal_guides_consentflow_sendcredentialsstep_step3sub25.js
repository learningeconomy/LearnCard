/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub25Inputs */

const en_developerportal_guides_consentflow_sendcredentialsstep_step3sub25 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get consent data for a specific user:`)
};

const es_developerportal_guides_consentflow_sendcredentialsstep_step3sub25 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener datos de consentimiento para un usuario específico:`)
};

const fr_developerportal_guides_consentflow_sendcredentialsstep_step3sub25 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir les données de consentement pour un utilisateur spécifique :`)
};

const ar_developerportal_guides_consentflow_sendcredentialsstep_step3sub25 = /** @type {(inputs: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احصل على بيانات الموافقة لمستخدم معين:`)
};

/**
* | output |
* | --- |
* | "Get consent data for a specific user:" |
*
* @param {Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_sendcredentialsstep_step3sub25 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Sendcredentialsstep_Step3sub25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_sendcredentialsstep_step3sub25(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_sendcredentialsstep_step3sub25(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_sendcredentialsstep_step3sub25(inputs)
	return ar_developerportal_guides_consentflow_sendcredentialsstep_step3sub25(inputs)
});
export { developerportal_guides_consentflow_sendcredentialsstep_step3sub25 as "developerPortal.guides.consentFlow.sendCredentialsStep.step3Sub2" }