/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Drafts2Inputs */

const en_developerportal_components_partnerdashboard_drafts2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Drafts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Drafts`)
};

const es_developerportal_components_partnerdashboard_drafts2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Drafts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borradores`)
};

const fr_developerportal_components_partnerdashboard_drafts2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Drafts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillons`)
};

const ar_developerportal_components_partnerdashboard_drafts2 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Drafts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسودات`)
};

/**
* | output |
* | --- |
* | "Drafts" |
*
* @param {Developerportal_Components_Partnerdashboard_Drafts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_drafts2 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Drafts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Drafts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_drafts2(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_drafts2(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_drafts2(inputs)
	return ar_developerportal_components_partnerdashboard_drafts2(inputs)
});
export { developerportal_components_partnerdashboard_drafts2 as "developerPortal.components.partnerDashboard.drafts" }