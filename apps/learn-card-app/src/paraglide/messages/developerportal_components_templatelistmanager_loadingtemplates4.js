/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Loadingtemplates4Inputs */

const en_developerportal_components_templatelistmanager_loadingtemplates4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Loadingtemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading templates...`)
};

const es_developerportal_components_templatelistmanager_loadingtemplates4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Loadingtemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando plantillas...`)
};

const fr_developerportal_components_templatelistmanager_loadingtemplates4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Loadingtemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des modèles...`)
};

const ar_developerportal_components_templatelistmanager_loadingtemplates4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Loadingtemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل القوالب...`)
};

/**
* | output |
* | --- |
* | "Loading templates..." |
*
* @param {Developerportal_Components_Templatelistmanager_Loadingtemplates4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_loadingtemplates4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Loadingtemplates4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Loadingtemplates4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_loadingtemplates4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_loadingtemplates4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_loadingtemplates4(inputs)
	return ar_developerportal_components_templatelistmanager_loadingtemplates4(inputs)
});
export { developerportal_components_templatelistmanager_loadingtemplates4 as "developerPortal.components.templateListManager.loadingTemplates" }