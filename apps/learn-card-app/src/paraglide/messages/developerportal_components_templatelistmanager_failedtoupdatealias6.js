/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Failedtoupdatealias6Inputs */

const en_developerportal_components_templatelistmanager_failedtoupdatealias6 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtoupdatealias6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to update alias`)
};

const es_developerportal_components_templatelistmanager_failedtoupdatealias6 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtoupdatealias6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al actualizar alias`)
};

const fr_developerportal_components_templatelistmanager_failedtoupdatealias6 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtoupdatealias6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour de l'alias`)
};

const ar_developerportal_components_templatelistmanager_failedtoupdatealias6 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtoupdatealias6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحديث الاسم المستعار`)
};

/**
* | output |
* | --- |
* | "Failed to update alias" |
*
* @param {Developerportal_Components_Templatelistmanager_Failedtoupdatealias6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_failedtoupdatealias6 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Failedtoupdatealias6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Failedtoupdatealias6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_failedtoupdatealias6(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_failedtoupdatealias6(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_failedtoupdatealias6(inputs)
	return ar_developerportal_components_templatelistmanager_failedtoupdatealias6(inputs)
});
export { developerportal_components_templatelistmanager_failedtoupdatealias6 as "developerPortal.components.templateListManager.failedToUpdateAlias" }