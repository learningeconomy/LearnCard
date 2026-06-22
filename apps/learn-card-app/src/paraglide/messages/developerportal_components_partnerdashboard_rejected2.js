/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Rejected2Inputs */

const en_developerportal_components_partnerdashboard_rejected2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Rejected2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejected`)
};

const es_developerportal_components_partnerdashboard_rejected2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Rejected2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechazadas`)
};

const fr_developerportal_components_partnerdashboard_rejected2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Rejected2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejetées`)
};

const ar_developerportal_components_partnerdashboard_rejected2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Rejected2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرفوضة`)
};

/**
* | output |
* | --- |
* | "Rejected" |
*
* @param {Developerportal_Components_Partnerdashboard_Rejected2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_rejected2 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Rejected2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Rejected2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_rejected2(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_rejected2(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_rejected2(inputs)
	return ar_developerportal_components_partnerdashboard_rejected2(inputs)
});
export { developerportal_components_partnerdashboard_rejected2 as "developerPortal.components.partnerDashboard.rejected" }