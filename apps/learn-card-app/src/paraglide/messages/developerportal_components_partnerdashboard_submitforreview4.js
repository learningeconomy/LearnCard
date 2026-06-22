/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Submitforreview4Inputs */

const en_developerportal_components_partnerdashboard_submitforreview4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Submitforreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Submit for Review`)
};

const es_developerportal_components_partnerdashboard_submitforreview4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Submitforreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar para Revisión`)
};

const fr_developerportal_components_partnerdashboard_submitforreview4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Submitforreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soumettre pour Révision`)
};

const ar_developerportal_components_partnerdashboard_submitforreview4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Submitforreview4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال للمراجعة`)
};

/**
* | output |
* | --- |
* | "Submit for Review" |
*
* @param {Developerportal_Components_Partnerdashboard_Submitforreview4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_submitforreview4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Submitforreview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Submitforreview4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_submitforreview4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_submitforreview4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_submitforreview4(inputs)
	return ar_developerportal_components_partnerdashboard_submitforreview4(inputs)
});
export { developerportal_components_partnerdashboard_submitforreview4 as "developerPortal.components.partnerDashboard.submitForReview" }