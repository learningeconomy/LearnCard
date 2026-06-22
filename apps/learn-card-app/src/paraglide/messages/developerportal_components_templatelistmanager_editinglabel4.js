/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Editinglabel4Inputs */

const en_developerportal_components_templatelistmanager_editinglabel4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Editinglabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editing`)
};

const es_developerportal_components_templatelistmanager_editinglabel4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Editinglabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editando`)
};

const fr_developerportal_components_templatelistmanager_editinglabel4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Editinglabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Édition`)
};

const ar_developerportal_components_templatelistmanager_editinglabel4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Editinglabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التعديل`)
};

/**
* | output |
* | --- |
* | "Editing" |
*
* @param {Developerportal_Components_Templatelistmanager_Editinglabel4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_editinglabel4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Editinglabel4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Editinglabel4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_editinglabel4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_editinglabel4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_editinglabel4(inputs)
	return ar_developerportal_components_templatelistmanager_editinglabel4(inputs)
});
export { developerportal_components_templatelistmanager_editinglabel4 as "developerPortal.components.templateListManager.editingLabel" }