/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Diagnosticspanel_Waitingforcalls4Inputs */

const en_developerportal_components_diagnosticspanel_waitingforcalls4 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Waitingforcalls4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting for partner app calls...`)
};

const es_developerportal_components_diagnosticspanel_waitingforcalls4 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Waitingforcalls4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esperando llamadas de la app partner...`)
};

const fr_developerportal_components_diagnosticspanel_waitingforcalls4 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Waitingforcalls4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente des appels de l'application partenaire...`)
};

const ar_developerportal_components_diagnosticspanel_waitingforcalls4 = /** @type {(inputs: Developerportal_Components_Diagnosticspanel_Waitingforcalls4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتظار مكالمات تطبيق الشريك...`)
};

/**
* | output |
* | --- |
* | "Waiting for partner app calls..." |
*
* @param {Developerportal_Components_Diagnosticspanel_Waitingforcalls4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_diagnosticspanel_waitingforcalls4 = /** @type {((inputs?: Developerportal_Components_Diagnosticspanel_Waitingforcalls4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Diagnosticspanel_Waitingforcalls4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_diagnosticspanel_waitingforcalls4(inputs)
	if (locale === "es") return es_developerportal_components_diagnosticspanel_waitingforcalls4(inputs)
	if (locale === "fr") return fr_developerportal_components_diagnosticspanel_waitingforcalls4(inputs)
	return ar_developerportal_components_diagnosticspanel_waitingforcalls4(inputs)
});
export { developerportal_components_diagnosticspanel_waitingforcalls4 as "developerPortal.components.diagnosticsPanel.waitingForCalls" }