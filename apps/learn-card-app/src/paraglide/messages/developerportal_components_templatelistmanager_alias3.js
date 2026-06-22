/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Alias3Inputs */

const en_developerportal_components_templatelistmanager_alias3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Alias3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alias:`)
};

const es_developerportal_components_templatelistmanager_alias3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Alias3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alias:`)
};

const fr_developerportal_components_templatelistmanager_alias3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Alias3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alias :`)
};

const ar_developerportal_components_templatelistmanager_alias3 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Alias3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم المستعار:`)
};

/**
* | output |
* | --- |
* | "Alias:" |
*
* @param {Developerportal_Components_Templatelistmanager_Alias3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_alias3 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Alias3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Alias3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_alias3(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_alias3(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_alias3(inputs)
	return ar_developerportal_components_templatelistmanager_alias3(inputs)
});
export { developerportal_components_templatelistmanager_alias3 as "developerPortal.components.templateListManager.alias" }