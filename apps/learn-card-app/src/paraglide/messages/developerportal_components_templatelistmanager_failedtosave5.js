/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Failedtosave5Inputs */

const en_developerportal_components_templatelistmanager_failedtosave5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtosave5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to save template`)
};

const es_developerportal_components_templatelistmanager_failedtosave5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtosave5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al guardar la plantilla`)
};

const fr_developerportal_components_templatelistmanager_failedtosave5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtosave5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'enregistrement du modèle`)
};

const ar_developerportal_components_templatelistmanager_failedtosave5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtosave5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حفظ القالب`)
};

/**
* | output |
* | --- |
* | "Failed to save template" |
*
* @param {Developerportal_Components_Templatelistmanager_Failedtosave5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_failedtosave5 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Failedtosave5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Failedtosave5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_failedtosave5(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_failedtosave5(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_failedtosave5(inputs)
	return ar_developerportal_components_templatelistmanager_failedtosave5(inputs)
});
export { developerportal_components_templatelistmanager_failedtosave5 as "developerPortal.components.templateListManager.failedToSave" }