/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ message: NonNullable<unknown> }} Developerportal_Components_Diagnosticspanel_Error2Inputs */

const en_developerportal_components_diagnosticspanel_error2 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Error2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error: ${i?.message}`)
};

const es_developerportal_components_diagnosticspanel_error2 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Error2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error: ${i?.message}`)
};

const fr_developerportal_components_diagnosticspanel_error2 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Error2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error: ${i?.message}`)
};

const ar_developerportal_components_diagnosticspanel_error2 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Error2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error: ${i?.message}`)
};

/**
* | output |
* | --- |
* | "Error: {message}" |
*
* @param {Developerportal_Components_Diagnosticspanel_Error2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_diagnosticspanel_error2 = /** @type {((inputs: Developerportal_Components_Diagnosticspanel_Error2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Diagnosticspanel_Error2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_diagnosticspanel_error2(inputs)
	if (locale === "es") return es_developerportal_components_diagnosticspanel_error2(inputs)
	if (locale === "fr") return fr_developerportal_components_diagnosticspanel_error2(inputs)
	return ar_developerportal_components_diagnosticspanel_error2(inputs)
});
export { developerportal_components_diagnosticspanel_error2 as "developerPortal.components.diagnosticsPanel.error" }