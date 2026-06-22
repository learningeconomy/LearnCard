/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Webhookdesc3Inputs */

const en_developerportal_onboarding_integrationmethod_webhookdesc3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhookdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your external system sends events to LearnCard when courses are completed. Credentials are issued automatically.`)
};

const es_developerportal_onboarding_integrationmethod_webhookdesc3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhookdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu sistema externo envía eventos a LearnCard cuando se completan los cursos. Las credenciales se emiten automáticamente.`)
};

const fr_developerportal_onboarding_integrationmethod_webhookdesc3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhookdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre système externe envoie des événements à LearnCard lorsque les cours sont terminés. Les credentials sont émis automatiquement.`)
};

const ar_developerportal_onboarding_integrationmethod_webhookdesc3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhookdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرسل نظامك الخارجي أحداثاً إلى LearnCard عند اكتمال الدورات. يتم إصدار بيانات الاعتماد تلقائياً.`)
};

/**
* | output |
* | --- |
* | "Your external system sends events to LearnCard when courses are completed. Credentials are issued automatically." |
*
* @param {Developerportal_Onboarding_Integrationmethod_Webhookdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_webhookdesc3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Webhookdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Webhookdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_webhookdesc3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_webhookdesc3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_webhookdesc3(inputs)
	return ar_developerportal_onboarding_integrationmethod_webhookdesc3(inputs)
});
export { developerportal_onboarding_integrationmethod_webhookdesc3 as "developerPortal.onboarding.integrationMethod.webhookDesc" }