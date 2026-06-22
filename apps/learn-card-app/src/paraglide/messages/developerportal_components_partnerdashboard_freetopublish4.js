/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Freetopublish4Inputs */

const en_developerportal_components_partnerdashboard_freetopublish4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Freetopublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Free to publish • No coding required`)
};

const es_developerportal_components_partnerdashboard_freetopublish4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Freetopublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Free to publish • No coding required`)
};

const fr_developerportal_components_partnerdashboard_freetopublish4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Freetopublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Free to publish • No coding required`)
};

const ar_developerportal_components_partnerdashboard_freetopublish4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Freetopublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Free to publish • No coding required`)
};

/**
* | output |
* | --- |
* | "Free to publish • No coding required" |
*
* @param {Developerportal_Components_Partnerdashboard_Freetopublish4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_freetopublish4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Freetopublish4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Freetopublish4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_freetopublish4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_freetopublish4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_freetopublish4(inputs)
	return ar_developerportal_components_partnerdashboard_freetopublish4(inputs)
});
export { developerportal_components_partnerdashboard_freetopublish4 as "developerPortal.components.partnerDashboard.freeToPublish" }