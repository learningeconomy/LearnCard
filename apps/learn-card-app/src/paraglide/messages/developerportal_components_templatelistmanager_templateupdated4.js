/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Templateupdated4Inputs */

const en_developerportal_components_templatelistmanager_templateupdated4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Templateupdated4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template updated!`)
};

const es_developerportal_components_templatelistmanager_templateupdated4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Templateupdated4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Plantilla actualizada!`)
};

const fr_developerportal_components_templatelistmanager_templateupdated4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Templateupdated4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle mis à jour !`)
};

const ar_developerportal_components_templatelistmanager_templateupdated4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Templateupdated4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث القالب!`)
};

/**
* | output |
* | --- |
* | "Template updated!" |
*
* @param {Developerportal_Components_Templatelistmanager_Templateupdated4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_templateupdated4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Templateupdated4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Templateupdated4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_templateupdated4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_templateupdated4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_templateupdated4(inputs)
	return ar_developerportal_components_templatelistmanager_templateupdated4(inputs)
});
export { developerportal_components_templatelistmanager_templateupdated4 as "developerPortal.components.templateListManager.templateUpdated" }