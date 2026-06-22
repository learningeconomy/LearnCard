/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Failedtocreate5Inputs */

const en_developerportal_components_templatelistmanager_failedtocreate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtocreate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to create template`)
};

const es_developerportal_components_templatelistmanager_failedtocreate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtocreate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al crear plantilla`)
};

const fr_developerportal_components_templatelistmanager_failedtocreate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtocreate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la création du modèle`)
};

const ar_developerportal_components_templatelistmanager_failedtocreate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Failedtocreate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء القالب`)
};

/**
* | output |
* | --- |
* | "Failed to create template" |
*
* @param {Developerportal_Components_Templatelistmanager_Failedtocreate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_failedtocreate5 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Failedtocreate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Failedtocreate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_failedtocreate5(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_failedtocreate5(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_failedtocreate5(inputs)
	return ar_developerportal_components_templatelistmanager_failedtocreate5(inputs)
});
export { developerportal_components_templatelistmanager_failedtocreate5 as "developerPortal.components.templateListManager.failedToCreate" }