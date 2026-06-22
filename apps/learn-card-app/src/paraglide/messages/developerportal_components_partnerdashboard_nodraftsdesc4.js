/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Nodraftsdesc4Inputs */

const en_developerportal_components_partnerdashboard_nodraftsdesc4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nodraftsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a new listing to get started`)
};

const es_developerportal_components_partnerdashboard_nodraftsdesc4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nodraftsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Create a new listing to get started]`)
};

const fr_developerportal_components_partnerdashboard_nodraftsdesc4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nodraftsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Create a new listing to get started]`)
};

const ar_developerportal_components_partnerdashboard_nodraftsdesc4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nodraftsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Create a new listing to get started]`)
};

/**
* | output |
* | --- |
* | "Create a new listing to get started" |
*
* @param {Developerportal_Components_Partnerdashboard_Nodraftsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_nodraftsdesc4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Nodraftsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Nodraftsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_nodraftsdesc4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_nodraftsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_nodraftsdesc4(inputs)
	return ar_developerportal_components_partnerdashboard_nodraftsdesc4(inputs)
});
export { developerportal_components_partnerdashboard_nodraftsdesc4 as "developerPortal.components.partnerDashboard.noDraftsDesc" }