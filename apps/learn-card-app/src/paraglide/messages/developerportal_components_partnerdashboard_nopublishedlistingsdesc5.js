/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Nopublishedlistingsdesc5Inputs */

const en_developerportal_components_partnerdashboard_nopublishedlistingsdesc5 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopublishedlistingsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your approved apps will appear here`)
};

const es_developerportal_components_partnerdashboard_nopublishedlistingsdesc5 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopublishedlistingsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your approved apps will appear here`)
};

const fr_developerportal_components_partnerdashboard_nopublishedlistingsdesc5 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopublishedlistingsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your approved apps will appear here`)
};

const ar_developerportal_components_partnerdashboard_nopublishedlistingsdesc5 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nopublishedlistingsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your approved apps will appear here`)
};

/**
* | output |
* | --- |
* | "Your approved apps will appear here" |
*
* @param {Developerportal_Components_Partnerdashboard_Nopublishedlistingsdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_nopublishedlistingsdesc5 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Nopublishedlistingsdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Nopublishedlistingsdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_nopublishedlistingsdesc5(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_nopublishedlistingsdesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_nopublishedlistingsdesc5(inputs)
	return ar_developerportal_components_partnerdashboard_nopublishedlistingsdesc5(inputs)
});
export { developerportal_components_partnerdashboard_nopublishedlistingsdesc5 as "developerPortal.components.partnerDashboard.noPublishedListingsDesc" }