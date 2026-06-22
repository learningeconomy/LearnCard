/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Step1desc4Inputs */

const en_developerportal_integrationguide_aitutor_step1desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Provide your AI tutor's base URL. Users will be redirected with topic and DID parameters.`)
};

const es_developerportal_integrationguide_aitutor_step1desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Proporciona la URL base de tu tutor IA. Los usuarios serán redirigidos con parámetros de tema y DID.`)
};

const fr_developerportal_integrationguide_aitutor_step1desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fournissez l'URL de base de votre tuteur IA. Les utilisateurs seront redirigés avec les paramètres de sujet et de DID.`)
};

const ar_developerportal_integrationguide_aitutor_step1desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step1desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قدم عنوان URL الأساسي للمعلم الذكي الخاص بك. ستتم إعادة توجيه المستخدمين مع معلمات الموضوع و DID.`)
};

/**
* | output |
* | --- |
* | "Provide your AI tutor's base URL. Users will be redirected with topic and DID parameters." |
*
* @param {Developerportal_Integrationguide_Aitutor_Step1desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_step1desc4 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Step1desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Step1desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_step1desc4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_step1desc4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_step1desc4(inputs)
	return ar_developerportal_integrationguide_aitutor_step1desc4(inputs)
});
export { developerportal_integrationguide_aitutor_step1desc4 as "developerPortal.integrationGuide.aiTutor.step1Desc" }