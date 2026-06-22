/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step2desc3Inputs */

const en_developerportal_integrationguide_consent_step2desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step2desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an endpoint to handle the redirect from LearnCard. The user's DID and a VP JWT (containing a delegate credential) will be included in the URL parameters.`)
};

const es_developerportal_integrationguide_consent_step2desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step2desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un endpoint para manejar la redirección desde LearnCard. El DID del usuario y un VP JWT (que contiene un credential delegado) se incluirán en los parámetros de la URL.`)
};

const fr_developerportal_integrationguide_consent_step2desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step2desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez un endpoint pour gérer la redirection depuis LearnCard. Le DID de l'utilisateur et un VP JWT (contenant un identifiant délégué) seront inclus dans les paramètres d'URL.`)
};

const ar_developerportal_integrationguide_consent_step2desc3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step2desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ نقطة نهاية لمعالجة إعادة التوجيه من LearnCard. سيتم تضمين DID المستخدم و VP JWT (الذي يحتوي على بيانات اعتماد مفوضة) في معلمات URL.`)
};

/**
* | output |
* | --- |
* | "Create an endpoint to handle the redirect from LearnCard. The user's DID and a VP JWT (containing a delegate credential) will be included in the URL parameters." |
*
* @param {Developerportal_Integrationguide_Consent_Step2desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step2desc3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step2desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step2desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step2desc3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step2desc3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step2desc3(inputs)
	return ar_developerportal_integrationguide_consent_step2desc3(inputs)
});
export { developerportal_integrationguide_consent_step2desc3 as "developerPortal.integrationGuide.consent.step2Desc" }