/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Templateremoved4Inputs */

const en_developerportal_components_templatelistmanager_templateremoved4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Templateremoved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template removed`)
};

const es_developerportal_components_templatelistmanager_templateremoved4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Templateremoved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantilla eliminada`)
};

const fr_developerportal_components_templatelistmanager_templateremoved4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Templateremoved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle supprimé`)
};

const ar_developerportal_components_templatelistmanager_templateremoved4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Templateremoved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت إزالة القالب`)
};

/**
* | output |
* | --- |
* | "Template removed" |
*
* @param {Developerportal_Components_Templatelistmanager_Templateremoved4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_templateremoved4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Templateremoved4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Templateremoved4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_templateremoved4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_templateremoved4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_templateremoved4(inputs)
	return ar_developerportal_components_templatelistmanager_templateremoved4(inputs)
});
export { developerportal_components_templatelistmanager_templateremoved4 as "developerPortal.components.templateListManager.templateRemoved" }