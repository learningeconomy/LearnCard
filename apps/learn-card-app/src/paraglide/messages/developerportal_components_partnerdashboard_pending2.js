/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Pending2Inputs */

const en_developerportal_components_partnerdashboard_pending2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Pending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pending`)
};

const es_developerportal_components_partnerdashboard_pending2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Pending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pendientes`)
};

const fr_developerportal_components_partnerdashboard_pending2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Pending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Attente`)
};

const ar_developerportal_components_partnerdashboard_pending2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Pending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الانتظار`)
};

/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Developerportal_Components_Partnerdashboard_Pending2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_pending2 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Pending2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Pending2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_pending2(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_pending2(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_pending2(inputs)
	return ar_developerportal_components_partnerdashboard_pending2(inputs)
});
export { developerportal_components_partnerdashboard_pending2 as "developerPortal.components.partnerDashboard.pending" }