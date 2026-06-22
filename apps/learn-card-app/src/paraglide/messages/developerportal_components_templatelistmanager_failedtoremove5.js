/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Failedtoremove5Inputs */

const en_developerportal_components_templatelistmanager_failedtoremove5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtoremove5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to remove template`)
};

const es_developerportal_components_templatelistmanager_failedtoremove5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtoremove5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al eliminar plantilla`)
};

const fr_developerportal_components_templatelistmanager_failedtoremove5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtoremove5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la suppression du modèle`)
};

const ar_developerportal_components_templatelistmanager_failedtoremove5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtoremove5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إزالة القالب`)
};

/**
* | output |
* | --- |
* | "Failed to remove template" |
*
* @param {Developerportal_Components_Templatelistmanager_Failedtoremove5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_failedtoremove5 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Failedtoremove5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Failedtoremove5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_failedtoremove5(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_failedtoremove5(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_failedtoremove5(inputs)
	return ar_developerportal_components_templatelistmanager_failedtoremove5(inputs)
});
export { developerportal_components_templatelistmanager_failedtoremove5 as "developerPortal.components.templateListManager.failedToRemove" }