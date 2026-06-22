/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Headerintegrationselector_Loading3Inputs */

const en_developerportal_components_headerintegrationselector_loading3 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Loading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_developerportal_components_headerintegrationselector_loading3 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Loading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const fr_developerportal_components_headerintegrationselector_loading3 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Loading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const ar_developerportal_components_headerintegrationselector_loading3 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Loading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Developerportal_Components_Headerintegrationselector_Loading3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_headerintegrationselector_loading3 = /** @type {((inputs?: Developerportal_Components_Headerintegrationselector_Loading3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Headerintegrationselector_Loading3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_headerintegrationselector_loading3(inputs)
	if (locale === "es") return es_developerportal_components_headerintegrationselector_loading3(inputs)
	if (locale === "fr") return fr_developerportal_components_headerintegrationselector_loading3(inputs)
	return ar_developerportal_components_headerintegrationselector_loading3(inputs)
});
export { developerportal_components_headerintegrationselector_loading3 as "developerPortal.components.headerIntegrationSelector.loading" }