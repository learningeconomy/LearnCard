/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Notemplates4Inputs */

const en_developerportal_components_templatelistmanager_notemplates4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Notemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No templates configured yet.`)
};

const es_developerportal_components_templatelistmanager_notemplates4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Notemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay plantillas configuradas.`)
};

const fr_developerportal_components_templatelistmanager_notemplates4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Notemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun modèle configuré pour l'instant.`)
};

const ar_developerportal_components_templatelistmanager_notemplates4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Notemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تكوين أي قوالب بعد.`)
};

/**
* | output |
* | --- |
* | "No templates configured yet." |
*
* @param {Developerportal_Components_Templatelistmanager_Notemplates4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_notemplates4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Notemplates4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Notemplates4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_notemplates4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_notemplates4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_notemplates4(inputs)
	return ar_developerportal_components_templatelistmanager_notemplates4(inputs)
});
export { developerportal_components_templatelistmanager_notemplates4 as "developerPortal.components.templateListManager.noTemplates" }