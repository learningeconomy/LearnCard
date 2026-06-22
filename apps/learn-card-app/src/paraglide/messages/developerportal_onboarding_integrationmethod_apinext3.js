/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Apinext3Inputs */

const en_developerportal_onboarding_integrationmethod_apinext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Apinext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll receive API documentation and code samples for calling our credential issuance endpoint. Use your API key from Step 1 to authenticate requests.`)
};

const es_developerportal_onboarding_integrationmethod_apinext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Apinext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recibirás documentación de la API y ejemplos de código para llamar a nuestro endpoint de emisión de credenciales. Usa tu clave API del Paso 1 para autenticar las solicitudes.`)
};

const fr_developerportal_onboarding_integrationmethod_apinext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Apinext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous recevrez la documentation de l'API et des exemples de code pour appeler notre endpoint d'émission de credentials. Utilisez votre clé API de l'Étape 1 pour authentifier les requêtes.`)
};

const ar_developerportal_onboarding_integrationmethod_apinext3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Apinext3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستتلقى وثائق API وأمثلة على الكود لاستدعاء نقطة نهاية إصدار بيانات الاعتماد الخاصة بنا. استخدم مفتاح API الخاص بك من الخطوة 1 لمصادقة الطلبات.`)
};

/**
* | output |
* | --- |
* | "You'll receive API documentation and code samples for calling our credential issuance endpoint. Use your API key from Step 1 to authenticate requests." |
*
* @param {Developerportal_Onboarding_Integrationmethod_Apinext3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_apinext3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Apinext3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Apinext3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_apinext3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_apinext3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_apinext3(inputs)
	return ar_developerportal_onboarding_integrationmethod_apinext3(inputs)
});
export { developerportal_onboarding_integrationmethod_apinext3 as "developerPortal.onboarding.integrationMethod.apiNext" }