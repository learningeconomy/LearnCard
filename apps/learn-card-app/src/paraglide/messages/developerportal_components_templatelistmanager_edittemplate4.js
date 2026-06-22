/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Edittemplate4Inputs */

const en_developerportal_components_templatelistmanager_edittemplate4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Edittemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit template`)
};

const es_developerportal_components_templatelistmanager_edittemplate4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Edittemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar plantilla`)
};

const fr_developerportal_components_templatelistmanager_edittemplate4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Edittemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le modèle`)
};

const ar_developerportal_components_templatelistmanager_edittemplate4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Edittemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل القالب`)
};

/**
* | output |
* | --- |
* | "Edit template" |
*
* @param {Developerportal_Components_Templatelistmanager_Edittemplate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_edittemplate4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Edittemplate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Edittemplate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_edittemplate4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_edittemplate4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_edittemplate4(inputs)
	return ar_developerportal_components_templatelistmanager_edittemplate4(inputs)
});
export { developerportal_components_templatelistmanager_edittemplate4 as "developerPortal.components.templateListManager.editTemplate" }