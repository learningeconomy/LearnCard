/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Integrationselector_Createnewintegration4Inputs */

const en_developerportal_components_integrationselector_createnewintegration4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Createnewintegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Integration`)
};

const es_developerportal_components_integrationselector_createnewintegration4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Createnewintegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Nueva Integración`)
};

const fr_developerportal_components_integrationselector_createnewintegration4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Createnewintegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une Nouvelle Intégration`)
};

const ar_developerportal_components_integrationselector_createnewintegration4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Createnewintegration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء تكامل جديد`)
};

/**
* | output |
* | --- |
* | "Create New Integration" |
*
* @param {Developerportal_Components_Integrationselector_Createnewintegration4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_integrationselector_createnewintegration4 = /** @type {((inputs?: Developerportal_Components_Integrationselector_Createnewintegration4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Integrationselector_Createnewintegration4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_integrationselector_createnewintegration4(inputs)
	if (locale === "es") return es_developerportal_components_integrationselector_createnewintegration4(inputs)
	if (locale === "fr") return fr_developerportal_components_integrationselector_createnewintegration4(inputs)
	return ar_developerportal_components_integrationselector_createnewintegration4(inputs)
});
export { developerportal_components_integrationselector_createnewintegration4 as "developerPortal.components.integrationSelector.createNewIntegration" }