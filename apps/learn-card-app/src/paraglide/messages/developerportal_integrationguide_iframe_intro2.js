/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Iframe_Intro2Inputs */

const en_developerportal_integrationguide_iframe_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an embedded app that runs inside the LearnCard wallet. Your app can request user identity, send credentials, and more.`)
};

const es_developerportal_integrationguide_iframe_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea una aplicación incrustada que se ejecute dentro de la billetera LearnCard. Tu aplicación puede solicitar la identidad del usuario, enviar credenciales y más.`)
};

const fr_developerportal_integrationguide_iframe_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez une application intégrée qui s'exécute dans le portefeuille LearnCard. Votre application peut demander l'identité de l'utilisateur, envoyer des identifiants, etc.`)
};

const ar_developerportal_integrationguide_iframe_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Iframe_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ تطبيقاً مضمنًا يعمل داخل محفظة LearnCard. يمكن لتطبيقك طلب هوية المستخدم وإرسال بيانات الاعتماد والمزيد.`)
};

/**
* | output |
* | --- |
* | "Create an embedded app that runs inside the LearnCard wallet. Your app can request user identity, send credentials, and more." |
*
* @param {Developerportal_Integrationguide_Iframe_Intro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_iframe_intro2 = /** @type {((inputs?: Developerportal_Integrationguide_Iframe_Intro2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Iframe_Intro2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_iframe_intro2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_iframe_intro2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_iframe_intro2(inputs)
	return ar_developerportal_integrationguide_iframe_intro2(inputs)
});
export { developerportal_integrationguide_iframe_intro2 as "developerPortal.integrationGuide.iframe.intro" }