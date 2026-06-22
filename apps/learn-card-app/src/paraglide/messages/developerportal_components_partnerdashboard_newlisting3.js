/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Newlisting3Inputs */

const en_developerportal_components_partnerdashboard_newlisting3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Newlisting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Listing`)
};

const es_developerportal_components_partnerdashboard_newlisting3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Newlisting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo Listado`)
};

const fr_developerportal_components_partnerdashboard_newlisting3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Newlisting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle Annonce`)
};

const ar_developerportal_components_partnerdashboard_newlisting3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Newlisting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائمة جديدة`)
};

/**
* | output |
* | --- |
* | "New Listing" |
*
* @param {Developerportal_Components_Partnerdashboard_Newlisting3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_newlisting3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Newlisting3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Newlisting3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_newlisting3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_newlisting3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_newlisting3(inputs)
	return ar_developerportal_components_partnerdashboard_newlisting3(inputs)
});
export { developerportal_components_partnerdashboard_newlisting3 as "developerPortal.components.partnerDashboard.newListing" }