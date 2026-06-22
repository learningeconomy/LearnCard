/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Templatelistmanager_Viewcode4Inputs */

const en_developerportal_components_templatelistmanager_viewcode4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Viewcode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View code`)
};

const es_developerportal_components_templatelistmanager_viewcode4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Viewcode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver código`)
};

const fr_developerportal_components_templatelistmanager_viewcode4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Viewcode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le code`)
};

const ar_developerportal_components_templatelistmanager_viewcode4 = /** @type {(inputs: Developerportal_Components_Templatelistmanager_Viewcode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الكود`)
};

/**
* | output |
* | --- |
* | "View code" |
*
* @param {Developerportal_Components_Templatelistmanager_Viewcode4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_templatelistmanager_viewcode4 = /** @type {((inputs?: Developerportal_Components_Templatelistmanager_Viewcode4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Templatelistmanager_Viewcode4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_templatelistmanager_viewcode4(inputs)
	if (locale === "es") return es_developerportal_components_templatelistmanager_viewcode4(inputs)
	if (locale === "fr") return fr_developerportal_components_templatelistmanager_viewcode4(inputs)
	return ar_developerportal_components_templatelistmanager_viewcode4(inputs)
});
export { developerportal_components_templatelistmanager_viewcode4 as "developerPortal.components.templateListManager.viewCode" }