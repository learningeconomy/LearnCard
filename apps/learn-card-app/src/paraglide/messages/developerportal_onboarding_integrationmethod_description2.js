/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Description2Inputs */

const en_developerportal_onboarding_integrationmethod_description2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How will your system communicate with LearnCard? We recommend the REST API for full programmatic control over credential issuance.`)
};

const es_developerportal_onboarding_integrationmethod_description2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cómo se comunicará tu sistema con LearnCard? Recomendamos la API REST para tener control programático completo sobre la emisión de credenciales.`)
};

const fr_developerportal_onboarding_integrationmethod_description2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment votre système communiquera-t-il avec LearnCard ? Nous recommandons l'API REST pour un contrôle programmatique complet de l'émission des credentials.`)
};

const ar_developerportal_onboarding_integrationmethod_description2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيف سيتواصل نظامك مع LearnCard؟ نوصي باستخدام REST API للتحكم البرمجي الكامل في إصدار بيانات الاعتماد.`)
};

/**
* | output |
* | --- |
* | "How will your system communicate with LearnCard? We recommend the REST API for full programmatic control over credential issuance." |
*
* @param {Developerportal_Onboarding_Integrationmethod_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_description2 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_description2(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_description2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_description2(inputs)
	return ar_developerportal_onboarding_integrationmethod_description2(inputs)
});
export { developerportal_onboarding_integrationmethod_description2 as "developerPortal.onboarding.integrationMethod.description" }