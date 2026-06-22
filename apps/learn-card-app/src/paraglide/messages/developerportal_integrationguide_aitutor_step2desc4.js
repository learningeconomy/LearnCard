/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Step2desc4Inputs */

const en_developerportal_integrationguide_aitutor_step2desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app receives the user's DID and selected topic as query parameters.`)
};

const es_developerportal_integrationguide_aitutor_step2desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu aplicación recibe el DID del usuario y el tema seleccionado como parámetros de consulta.`)
};

const fr_developerportal_integrationguide_aitutor_step2desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre application reçoit le DID de l'utilisateur et le sujet sélectionné comme paramètres de requête.`)
};

const ar_developerportal_integrationguide_aitutor_step2desc4 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتلقى تطبيقك DID المستخدم والموضوع المحدد كمعلمات استعلام.`)
};

/**
* | output |
* | --- |
* | "Your app receives the user's DID and selected topic as query parameters." |
*
* @param {Developerportal_Integrationguide_Aitutor_Step2desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_step2desc4 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Step2desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Step2desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_step2desc4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_step2desc4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_step2desc4(inputs)
	return ar_developerportal_integrationguide_aitutor_step2desc4(inputs)
});
export { developerportal_integrationguide_aitutor_step2desc4 as "developerPortal.integrationGuide.aiTutor.step2Desc" }