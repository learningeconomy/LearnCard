/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Designyourtemplate5Inputs */

const en_developerportal_components_templatelistmanager_designyourtemplate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Designyourtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Design Your Credential Template`)
};

const es_developerportal_components_templatelistmanager_designyourtemplate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Designyourtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diseña Tu Plantilla de Credencial`)
};

const fr_developerportal_components_templatelistmanager_designyourtemplate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Designyourtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Concevez Votre Modèle de Credential`)
};

const ar_developerportal_components_templatelistmanager_designyourtemplate5 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Designyourtemplate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صمم قالب بيانات الاعتماد الخاص بك`)
};

/**
* | output |
* | --- |
* | "Design Your Credential Template" |
*
* @param {Developerportal_Components_Templatelistmanager_Designyourtemplate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_designyourtemplate5 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Designyourtemplate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Designyourtemplate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_designyourtemplate5(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_designyourtemplate5(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_designyourtemplate5(inputs)
	return ar_developerportal_components_templatelistmanager_designyourtemplate5(inputs)
});
export { developerportal_components_templatelistmanager_designyourtemplate5 as "developerPortal.components.templateListManager.designYourTemplate" }