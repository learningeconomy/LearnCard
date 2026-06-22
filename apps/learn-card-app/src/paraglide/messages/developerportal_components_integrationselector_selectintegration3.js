/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Integrationselector_Selectintegration3Inputs */

const en_developerportal_components_integrationselector_selectintegration3 = /** @type {(inputs: Developerportal_Components_Integrationselector_Selectintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Integration`)
};

const es_developerportal_components_integrationselector_selectintegration3 = /** @type {(inputs: Developerportal_Components_Integrationselector_Selectintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Integración`)
};

const fr_developerportal_components_integrationselector_selectintegration3 = /** @type {(inputs: Developerportal_Components_Integrationselector_Selectintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner l'Intégration`)
};

const ar_developerportal_components_integrationselector_selectintegration3 = /** @type {(inputs: Developerportal_Components_Integrationselector_Selectintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار التكامل`)
};

/**
* | output |
* | --- |
* | "Select Integration" |
*
* @param {Developerportal_Components_Integrationselector_Selectintegration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_integrationselector_selectintegration3 = /** @type {((inputs?: Developerportal_Components_Integrationselector_Selectintegration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Integrationselector_Selectintegration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_integrationselector_selectintegration3(inputs)
	if (locale === "es") return es_developerportal_components_integrationselector_selectintegration3(inputs)
	if (locale === "fr") return fr_developerportal_components_integrationselector_selectintegration3(inputs)
	return ar_developerportal_components_integrationselector_selectintegration3(inputs)
});
export { developerportal_components_integrationselector_selectintegration3 as "developerPortal.components.integrationSelector.selectIntegration" }