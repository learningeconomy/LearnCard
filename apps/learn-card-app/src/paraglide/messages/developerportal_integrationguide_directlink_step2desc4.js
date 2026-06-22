/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Step2desc4Inputs */

const en_developerportal_integrationguide_directlink_step2desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard can append the user's DID as a query parameter for identification.`)
};

const es_developerportal_integrationguide_directlink_step2desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard puede añadir el DID del usuario como un parámetro de consulta para identificación.`)
};

const fr_developerportal_integrationguide_directlink_step2desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard peut ajouter le DID de l'utilisateur comme paramètre de requête pour l'identification.`)
};

const ar_developerportal_integrationguide_directlink_step2desc4 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Step2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكن لـ LearnCard إلحاق DID المستخدم كمعلمة استعلام للتعريف.`)
};

/**
* | output |
* | --- |
* | "LearnCard can append the user's DID as a query parameter for identification." |
*
* @param {Developerportal_Integrationguide_Directlink_Step2desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_step2desc4 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Step2desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Step2desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_step2desc4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_step2desc4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_step2desc4(inputs)
	return ar_developerportal_integrationguide_directlink_step2desc4(inputs)
});
export { developerportal_integrationguide_directlink_step2desc4 as "developerPortal.integrationGuide.directLink.step2Desc" }