/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Createfirsttemplate5Inputs */

const en_developerportal_components_templatelistmanager_createfirsttemplate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Createfirsttemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your First Template`)
};

const es_developerportal_components_templatelistmanager_createfirsttemplate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Createfirsttemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea Tu Primera Plantilla`)
};

const fr_developerportal_components_templatelistmanager_createfirsttemplate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Createfirsttemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez Votre Premier Modèle`)
};

const ar_developerportal_components_templatelistmanager_createfirsttemplate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Createfirsttemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ قالبك الأول`)
};

/**
* | output |
* | --- |
* | "Create Your First Template" |
*
* @param {Developerportal_Components_Templatelistmanager_Createfirsttemplate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_createfirsttemplate5 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Createfirsttemplate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Createfirsttemplate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_createfirsttemplate5(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_createfirsttemplate5(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_createfirsttemplate5(inputs)
	return ar_developerportal_components_templatelistmanager_createfirsttemplate5(inputs)
});
export { developerportal_components_templatelistmanager_createfirsttemplate5 as "developerPortal.components.templateListManager.createFirstTemplate" }