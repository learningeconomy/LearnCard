/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Diagnosticspanel_Nonerequested3Inputs */

const en_developerportal_components_diagnosticspanel_nonerequested3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Nonerequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`None requested`)
};

const es_developerportal_components_diagnosticspanel_nonerequested3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Nonerequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ninguno solicitado`)
};

const fr_developerportal_components_diagnosticspanel_nonerequested3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Nonerequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune demandée`)
};

const ar_developerportal_components_diagnosticspanel_nonerequested3 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Nonerequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم طلب أي شيء`)
};

/**
* | output |
* | --- |
* | "None requested" |
*
* @param {Developerportal_Components_Diagnosticspanel_Nonerequested3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_diagnosticspanel_nonerequested3 = /** @type {((inputs?: Developerportal_Components_Diagnosticspanel_Nonerequested3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Diagnosticspanel_Nonerequested3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_diagnosticspanel_nonerequested3(inputs)
	if (locale === "es") return es_developerportal_components_diagnosticspanel_nonerequested3(inputs)
	if (locale === "fr") return fr_developerportal_components_diagnosticspanel_nonerequested3(inputs)
	return ar_developerportal_components_diagnosticspanel_nonerequested3(inputs)
});
export { developerportal_components_diagnosticspanel_nonerequested3 as "developerPortal.components.diagnosticsPanel.noneRequested" }