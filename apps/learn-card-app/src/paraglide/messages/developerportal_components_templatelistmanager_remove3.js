/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Remove3Inputs */

const en_developerportal_components_templatelistmanager_remove3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Remove3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove`)
};

const es_developerportal_components_templatelistmanager_remove3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Remove3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_developerportal_components_templatelistmanager_remove3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Remove3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ar_developerportal_components_templatelistmanager_remove3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Remove3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة`)
};

/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Developerportal_Components_Templatelistmanager_Remove3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_remove3 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Remove3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Remove3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_remove3(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_remove3(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_remove3(inputs)
	return ar_developerportal_components_templatelistmanager_remove3(inputs)
});
export { developerportal_components_templatelistmanager_remove3 as "developerPortal.components.templateListManager.remove" }