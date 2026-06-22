/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Integrationselector_Integrationnameplaceholder4Inputs */

const en_developerportal_components_integrationselector_integrationnameplaceholder4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Integrationnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration name...`)
};

const es_developerportal_components_integrationselector_integrationnameplaceholder4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Integrationnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de integración...`)
};

const fr_developerportal_components_integrationselector_integrationnameplaceholder4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Integrationnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom d'intégration...`)
};

const ar_developerportal_components_integrationselector_integrationnameplaceholder4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Integrationnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم التكامل...`)
};

/**
* | output |
* | --- |
* | "Integration name..." |
*
* @param {Developerportal_Components_Integrationselector_Integrationnameplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_integrationselector_integrationnameplaceholder4 = /** @type {((inputs?: Developerportal_Components_Integrationselector_Integrationnameplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Integrationselector_Integrationnameplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_integrationselector_integrationnameplaceholder4(inputs)
	if (locale === "es") return es_developerportal_components_integrationselector_integrationnameplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_components_integrationselector_integrationnameplaceholder4(inputs)
	return ar_developerportal_components_integrationselector_integrationnameplaceholder4(inputs)
});
export { developerportal_components_integrationselector_integrationnameplaceholder4 as "developerPortal.components.integrationSelector.integrationNamePlaceholder" }