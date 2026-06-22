/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Step1desc3Inputs */

const en_developerportal_components_partnerdashboard_step1desc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build your app listing with details, icon, screenshots, and integration settings.`)
};

const es_developerportal_components_partnerdashboard_step1desc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build your app listing with details, icon, screenshots, and integration settings.`)
};

const fr_developerportal_components_partnerdashboard_step1desc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build your app listing with details, icon, screenshots, and integration settings.`)
};

const ar_developerportal_components_partnerdashboard_step1desc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step1desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build your app listing with details, icon, screenshots, and integration settings.`)
};

/**
* | output |
* | --- |
* | "Build your app listing with details, icon, screenshots, and integration settings." |
*
* @param {Developerportal_Components_Partnerdashboard_Step1desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_step1desc3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Step1desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Step1desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_step1desc3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_step1desc3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_step1desc3(inputs)
	return ar_developerportal_components_partnerdashboard_step1desc3(inputs)
});
export { developerportal_components_partnerdashboard_step1desc3 as "developerPortal.components.partnerDashboard.step1Desc" }