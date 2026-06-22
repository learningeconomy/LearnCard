/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Nodraftstitle4Inputs */

const en_developerportal_components_partnerdashboard_nodraftstitle4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nodraftstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No draft listings`)
};

const es_developerportal_components_partnerdashboard_nodraftstitle4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nodraftstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[No draft listings]`)
};

const fr_developerportal_components_partnerdashboard_nodraftstitle4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nodraftstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[No draft listings]`)
};

const ar_developerportal_components_partnerdashboard_nodraftstitle4 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Nodraftstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[No draft listings]`)
};

/**
* | output |
* | --- |
* | "No draft listings" |
*
* @param {Developerportal_Components_Partnerdashboard_Nodraftstitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_nodraftstitle4 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Nodraftstitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Nodraftstitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_nodraftstitle4(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_nodraftstitle4(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_nodraftstitle4(inputs)
	return ar_developerportal_components_partnerdashboard_nodraftstitle4(inputs)
});
export { developerportal_components_partnerdashboard_nodraftstitle4 as "developerPortal.components.partnerDashboard.noDraftsTitle" }