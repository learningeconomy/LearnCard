/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Webhooknext3Inputs */

const en_developerportal_onboarding_integrationmethod_webhooknext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhooknext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We'll provide you with a webhook URL to configure in your external system. When a course is completed, your external system will send an event to this URL, and we'll map the data to your credential template.`)
};

const es_developerportal_onboarding_integrationmethod_webhooknext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhooknext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Te proporcionaremos una URL de webhook para configurar en tu sistema externo. Cuando se complete un curso, tu sistema externo enviará un evento a esta URL, y nosotros mapearemos los datos a tu plantilla de credencial.`)
};

const fr_developerportal_onboarding_integrationmethod_webhooknext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhooknext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous vous fournirons une URL de webhook à configurer dans votre système externe. Lorsqu'un cours est terminé, votre système externe enverra un événement à cette URL, et nous mapperons les données à votre modèle de credential.`)
};

const ar_developerportal_onboarding_integrationmethod_webhooknext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Webhooknext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سنزودك بعنوان URL للwebhook لتكوينه في نظامك الخارجي. عند اكتمال دورة، سيرسل نظامك الخارجي حدثاً إلى هذا العنوان، وسنقوم بتخطيط البيانات لقالب بيانات الاعتماد الخاص بك.`)
};

/**
* | output |
* | --- |
* | "We'll provide you with a webhook URL to configure in your external system. When a course is completed, your external system will send an event to this URL, a..." |
*
* @param {Developerportal_Onboarding_Integrationmethod_Webhooknext3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_webhooknext3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Webhooknext3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Webhooknext3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_webhooknext3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_webhooknext3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_webhooknext3(inputs)
	return ar_developerportal_onboarding_integrationmethod_webhooknext3(inputs)
});
export { developerportal_onboarding_integrationmethod_webhooknext3 as "developerPortal.onboarding.integrationMethod.webhookNext" }