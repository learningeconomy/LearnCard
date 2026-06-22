/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Selecttemplate4Inputs */

const en_developerportal_components_templatelistmanager_selecttemplate4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Selecttemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select template:`)
};

const es_developerportal_components_templatelistmanager_selecttemplate4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Selecttemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar plantilla:`)
};

const fr_developerportal_components_templatelistmanager_selecttemplate4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Selecttemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un modèle :`)
};

const ar_developerportal_components_templatelistmanager_selecttemplate4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Selecttemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قالباً:`)
};

/**
* | output |
* | --- |
* | "Select template:" |
*
* @param {Developerportal_Components_Templatelistmanager_Selecttemplate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_selecttemplate4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Selecttemplate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Selecttemplate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_selecttemplate4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_selecttemplate4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_selecttemplate4(inputs)
	return ar_developerportal_components_templatelistmanager_selecttemplate4(inputs)
});
export { developerportal_components_templatelistmanager_selecttemplate4 as "developerPortal.components.templateListManager.selectTemplate" }