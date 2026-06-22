/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Yourapplistings4Inputs */

const en_developerportal_components_partnerdashboard_yourapplistings4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Yourapplistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your App Listings`)
};

const es_developerportal_components_partnerdashboard_yourapplistings4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Yourapplistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus Listados de Apps`)
};

const fr_developerportal_components_partnerdashboard_yourapplistings4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Yourapplistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos Annonces d'Applications`)
};

const ar_developerportal_components_partnerdashboard_yourapplistings4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Yourapplistings4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قوائم تطبيقاتك`)
};

/**
* | output |
* | --- |
* | "Your App Listings" |
*
* @param {Developerportal_Components_Partnerdashboard_Yourapplistings4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_yourapplistings4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Yourapplistings4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Yourapplistings4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_yourapplistings4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_yourapplistings4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_yourapplistings4(inputs)
	return ar_developerportal_components_partnerdashboard_yourapplistings4(inputs)
});
export { developerportal_components_partnerdashboard_yourapplistings4 as "developerPortal.components.partnerDashboard.yourAppListings" }