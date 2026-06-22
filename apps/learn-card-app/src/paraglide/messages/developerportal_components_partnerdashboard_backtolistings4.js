/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Backtolistings4Inputs */

const en_developerportal_components_partnerdashboard_backtolistings4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Backtolistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back to listings`)
};

const es_developerportal_components_partnerdashboard_backtolistings4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Backtolistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a listados`)
};

const fr_developerportal_components_partnerdashboard_backtolistings4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Backtolistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour aux annonces`)
};

const ar_developerportal_components_partnerdashboard_backtolistings4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Backtolistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى القوائم`)
};

/**
* | output |
* | --- |
* | "Back to listings" |
*
* @param {Developerportal_Components_Partnerdashboard_Backtolistings4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_backtolistings4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Backtolistings4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Backtolistings4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_backtolistings4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_backtolistings4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_backtolistings4(inputs)
	return ar_developerportal_components_partnerdashboard_backtolistings4(inputs)
});
export { developerportal_components_partnerdashboard_backtolistings4 as "developerPortal.components.partnerDashboard.backToListings" }