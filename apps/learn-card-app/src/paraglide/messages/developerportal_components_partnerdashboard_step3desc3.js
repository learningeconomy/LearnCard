/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Step3desc3Inputs */

const en_developerportal_components_partnerdashboard_step3desc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Once approved, your app goes live in the App Store for users to discover.`)
};

const es_developerportal_components_partnerdashboard_step3desc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Once approved, your app goes live in the App Store for users to discover.`)
};

const fr_developerportal_components_partnerdashboard_step3desc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Once approved, your app goes live in the App Store for users to discover.`)
};

const ar_developerportal_components_partnerdashboard_step3desc3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step3desc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Once approved, your app goes live in the App Store for users to discover.`)
};

/**
* | output |
* | --- |
* | "Once approved, your app goes live in the App Store for users to discover." |
*
* @param {Developerportal_Components_Partnerdashboard_Step3desc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_step3desc3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Step3desc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Step3desc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_step3desc3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_step3desc3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_step3desc3(inputs)
	return ar_developerportal_components_partnerdashboard_step3desc3(inputs)
});
export { developerportal_components_partnerdashboard_step3desc3 as "developerPortal.components.partnerDashboard.step3Desc" }