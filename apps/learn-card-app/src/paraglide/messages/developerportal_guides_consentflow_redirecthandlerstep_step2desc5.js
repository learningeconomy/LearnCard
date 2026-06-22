/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2desc5Inputs */

const en_developerportal_guides_consentflow_redirecthandlerstep_step2desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an endpoint to handle the redirect. The user's DID and a VP JWT (containing a delegate credential) will be included in the URL parameters.`)
};

const es_developerportal_guides_consentflow_redirecthandlerstep_step2desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un endpoint para manejar la redirección. El DID del usuario y un VP JWT (que contiene una credencial delegada) se incluirán en los parámetros de la URL.`)
};

const fr_developerportal_guides_consentflow_redirecthandlerstep_step2desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez un endpoint pour gérer la redirection. Le DID de l'utilisateur et un VP JWT (contenant un certificat délégué) seront inclus dans les paramètres de l'URL.`)
};

const ar_developerportal_guides_consentflow_redirecthandlerstep_step2desc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2desc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ نقطة نهاية لمعالجة إعادة التوجيه. سيتم تضمين DID المستخدم و VP JWT (الذي يحتوي على مؤهل مفوض) في معلمات URL.`)
};

/**
* | output |
* | --- |
* | "Create an endpoint to handle the redirect. The user's DID and a VP JWT (containing a delegate credential) will be included in the URL parameters." |
*
* @param {Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2desc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_redirecthandlerstep_step2desc5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2desc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Redirecthandlerstep_Step2desc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_redirecthandlerstep_step2desc5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_redirecthandlerstep_step2desc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_redirecthandlerstep_step2desc5(inputs)
	return ar_developerportal_guides_consentflow_redirecthandlerstep_step2desc5(inputs)
});
export { developerportal_guides_consentflow_redirecthandlerstep_step2desc5 as "developerPortal.guides.consentFlow.redirectHandlerStep.step2Desc" }