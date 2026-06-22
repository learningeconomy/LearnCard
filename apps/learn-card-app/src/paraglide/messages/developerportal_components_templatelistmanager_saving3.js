/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Saving3Inputs */

const en_developerportal_components_templatelistmanager_saving3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_developerportal_components_templatelistmanager_saving3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const fr_developerportal_components_templatelistmanager_saving3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarde...`)
};

const ar_developerportal_components_templatelistmanager_saving3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Saving3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الحفظ...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Developerportal_Components_Templatelistmanager_Saving3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_saving3 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Saving3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Saving3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_saving3(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_saving3(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_saving3(inputs)
	return ar_developerportal_components_templatelistmanager_saving3(inputs)
});
export { developerportal_components_templatelistmanager_saving3 as "developerPortal.components.templateListManager.saving" }