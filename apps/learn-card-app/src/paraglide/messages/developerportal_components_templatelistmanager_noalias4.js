/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Noalias4Inputs */

const en_developerportal_components_templatelistmanager_noalias4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Noalias4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No alias`)
};

const es_developerportal_components_templatelistmanager_noalias4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Noalias4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin alias`)
};

const fr_developerportal_components_templatelistmanager_noalias4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Noalias4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas d'alias`)
};

const ar_developerportal_components_templatelistmanager_noalias4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Noalias4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد اسم مستعار`)
};

/**
* | output |
* | --- |
* | "No alias" |
*
* @param {Developerportal_Components_Templatelistmanager_Noalias4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_noalias4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Noalias4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Noalias4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_noalias4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_noalias4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_noalias4(inputs)
	return ar_developerportal_components_templatelistmanager_noalias4(inputs)
});
export { developerportal_components_templatelistmanager_noalias4 as "developerPortal.components.templateListManager.noAlias" }