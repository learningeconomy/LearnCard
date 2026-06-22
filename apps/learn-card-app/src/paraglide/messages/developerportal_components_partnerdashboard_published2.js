/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Published2Inputs */

const en_developerportal_components_partnerdashboard_published2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Published2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Published`)
};

const es_developerportal_components_partnerdashboard_published2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Published2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicadas`)
};

const fr_developerportal_components_partnerdashboard_published2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Published2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publiées`)
};

const ar_developerportal_components_partnerdashboard_published2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Published2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منشورة`)
};

/**
* | output |
* | --- |
* | "Published" |
*
* @param {Developerportal_Components_Partnerdashboard_Published2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_published2 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Published2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Published2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_published2(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_published2(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_published2(inputs)
	return ar_developerportal_components_partnerdashboard_published2(inputs)
});
export { developerportal_components_partnerdashboard_published2 as "developerPortal.components.partnerDashboard.published" }