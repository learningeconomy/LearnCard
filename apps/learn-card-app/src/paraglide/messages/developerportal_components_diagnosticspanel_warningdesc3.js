/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Components_Diagnosticspanel_Warningdesc3Inputs */

const en_developerportal_components_diagnosticspanel_warningdesc3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Warningdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`This app made ${i?.count} call(s) using permissions it did not request. Users may be shown additional consent prompts or calls may fail.`)
};

const es_developerportal_components_diagnosticspanel_warningdesc3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Warningdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`This app made ${i?.count} call(s) using permissions it did not request. Users may be shown additional consent prompts or calls may fail.`)
};

const fr_developerportal_components_diagnosticspanel_warningdesc3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Warningdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`This app made ${i?.count} call(s) using permissions it did not request. Users may be shown additional consent prompts or calls may fail.`)
};

const ar_developerportal_components_diagnosticspanel_warningdesc3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Warningdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`This app made ${i?.count} call(s) using permissions it did not request. Users may be shown additional consent prompts or calls may fail.`)
};

/**
* | output |
* | --- |
* | "This app made {count} call(s) using permissions it did not request. Users may be shown additional consent prompts or calls may fail." |
*
* @param {Developerportal_Components_Diagnosticspanel_Warningdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_diagnosticspanel_warningdesc3 = /** @type {((inputs: Developerportal_Components_Diagnosticspanel_Warningdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Diagnosticspanel_Warningdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_diagnosticspanel_warningdesc3(inputs)
	if (locale === "es") return es_developerportal_components_diagnosticspanel_warningdesc3(inputs)
	if (locale === "fr") return fr_developerportal_components_diagnosticspanel_warningdesc3(inputs)
	return ar_developerportal_components_diagnosticspanel_warningdesc3(inputs)
});
export { developerportal_components_diagnosticspanel_warningdesc3 as "developerPortal.components.diagnosticsPanel.warningDesc" }