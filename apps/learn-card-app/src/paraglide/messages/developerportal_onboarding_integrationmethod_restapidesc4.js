/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Restapidesc4Inputs */

const en_developerportal_onboarding_integrationmethod_restapidesc4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Restapidesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Call our API directly from your backend code when you want to issue credentials.`)
};

const es_developerportal_onboarding_integrationmethod_restapidesc4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Restapidesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Llama a nuestra API directamente desde el código de tu backend cuando quieras emitir credenciales.`)
};

const fr_developerportal_onboarding_integrationmethod_restapidesc4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Restapidesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appelez notre API directement depuis le code de votre backend pour émettre des credentials.`)
};

const ar_developerportal_onboarding_integrationmethod_restapidesc4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Restapidesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اتصل بـ API الخاص بنا مباشرة من كود الخلفية الخاص بك عندما تريد إصدار بيانات الاعتماد.`)
};

/**
* | output |
* | --- |
* | "Call our API directly from your backend code when you want to issue credentials." |
*
* @param {Developerportal_Onboarding_Integrationmethod_Restapidesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_restapidesc4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Restapidesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Restapidesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_restapidesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_restapidesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_restapidesc4(inputs)
	return ar_developerportal_onboarding_integrationmethod_restapidesc4(inputs)
});
export { developerportal_onboarding_integrationmethod_restapidesc4 as "developerPortal.onboarding.integrationMethod.restApiDesc" }