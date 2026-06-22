/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Step1title3Inputs */

const en_developerportal_components_partnerdashboard_step1title3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step1title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create`)
};

const es_developerportal_components_partnerdashboard_step1title3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step1title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear`)
};

const fr_developerportal_components_partnerdashboard_step1title3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step1title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer`)
};

const ar_developerportal_components_partnerdashboard_step1title3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Step1title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء`)
};

/**
* | output |
* | --- |
* | "Create" |
*
* @param {Developerportal_Components_Partnerdashboard_Step1title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_step1title3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Step1title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Step1title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_step1title3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_step1title3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_step1title3(inputs)
	return ar_developerportal_components_partnerdashboard_step1title3(inputs)
});
export { developerportal_components_partnerdashboard_step1title3 as "developerPortal.components.partnerDashboard.step1Title" }