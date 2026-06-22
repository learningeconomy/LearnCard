/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Savechanges4Inputs */

const en_developerportal_components_templatelistmanager_savechanges4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Savechanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Changes`)
};

const es_developerportal_components_templatelistmanager_savechanges4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Savechanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar Cambios`)
};

const fr_developerportal_components_templatelistmanager_savechanges4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Savechanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer les Modifications`)
};

const ar_developerportal_components_templatelistmanager_savechanges4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Savechanges4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ التغييرات`)
};

/**
* | output |
* | --- |
* | "Save Changes" |
*
* @param {Developerportal_Components_Templatelistmanager_Savechanges4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_savechanges4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Savechanges4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Savechanges4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_savechanges4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_savechanges4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_savechanges4(inputs)
	return ar_developerportal_components_templatelistmanager_savechanges4(inputs)
});
export { developerportal_components_templatelistmanager_savechanges4 as "developerPortal.components.templateListManager.saveChanges" }