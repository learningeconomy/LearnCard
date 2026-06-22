/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Createfirstlisting4Inputs */

const en_developerportal_components_partnerdashboard_createfirstlisting4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Createfirstlisting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your First Listing`)
};

const es_developerportal_components_partnerdashboard_createfirstlisting4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Createfirstlisting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your First Listing`)
};

const fr_developerportal_components_partnerdashboard_createfirstlisting4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Createfirstlisting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your First Listing`)
};

const ar_developerportal_components_partnerdashboard_createfirstlisting4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Createfirstlisting4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your First Listing`)
};

/**
* | output |
* | --- |
* | "Create Your First Listing" |
*
* @param {Developerportal_Components_Partnerdashboard_Createfirstlisting4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_createfirstlisting4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Createfirstlisting4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Createfirstlisting4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_createfirstlisting4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_createfirstlisting4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_createfirstlisting4(inputs)
	return ar_developerportal_components_partnerdashboard_createfirstlisting4(inputs)
});
export { developerportal_components_partnerdashboard_createfirstlisting4 as "developerPortal.components.partnerDashboard.createFirstListing" }