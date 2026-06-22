/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Diagnosticspanel_Notrequested3Inputs */

const en_developerportal_components_diagnosticspanel_notrequested3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Notrequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` (not requested!)`)
};

const es_developerportal_components_diagnosticspanel_notrequested3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Notrequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` (¡no solicitado!)`)
};

const fr_developerportal_components_diagnosticspanel_notrequested3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Notrequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` (pas demandée !)`)
};

const ar_developerportal_components_diagnosticspanel_notrequested3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Notrequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` (غير مطلوب!)`)
};

/**
* | output |
* | --- |
* | "(not requested!)" |
*
* @param {Developerportal_Components_Diagnosticspanel_Notrequested3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_diagnosticspanel_notrequested3 = /** @type {((inputs?: Developerportal_Components_Diagnosticspanel_Notrequested3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Diagnosticspanel_Notrequested3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_diagnosticspanel_notrequested3(inputs)
	if (locale === "es") return es_developerportal_components_diagnosticspanel_notrequested3(inputs)
	if (locale === "fr") return fr_developerportal_components_diagnosticspanel_notrequested3(inputs)
	return ar_developerportal_components_diagnosticspanel_notrequested3(inputs)
});
export { developerportal_components_diagnosticspanel_notrequested3 as "developerPortal.components.diagnosticsPanel.notRequested" }