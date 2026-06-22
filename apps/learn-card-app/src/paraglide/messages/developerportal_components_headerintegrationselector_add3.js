/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Headerintegrationselector_Add3Inputs */

const en_developerportal_components_headerintegrationselector_add3 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Add3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add`)
};

const es_developerportal_components_headerintegrationselector_add3 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Add3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir`)
};

const fr_developerportal_components_headerintegrationselector_add3 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Add3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter`)
};

const ar_developerportal_components_headerintegrationselector_add3 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Add3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة`)
};

/**
* | output |
* | --- |
* | "Add" |
*
* @param {Developerportal_Components_Headerintegrationselector_Add3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_headerintegrationselector_add3 = /** @type {((inputs?: Developerportal_Components_Headerintegrationselector_Add3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Headerintegrationselector_Add3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_headerintegrationselector_add3(inputs)
	if (locale === "es") return es_developerportal_components_headerintegrationselector_add3(inputs)
	if (locale === "fr") return fr_developerportal_components_headerintegrationselector_add3(inputs)
	return ar_developerportal_components_headerintegrationselector_add3(inputs)
});
export { developerportal_components_headerintegrationselector_add3 as "developerPortal.components.headerIntegrationSelector.add" }