/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Resources_Documentation_Description1Inputs */

const en_developerportal_guides_hub_resources_documentation_description1 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Documentation_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full API reference`)
};

const es_developerportal_guides_hub_resources_documentation_description1 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Documentation_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Referencia completa de la API`)
};

const fr_developerportal_guides_hub_resources_documentation_description1 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Documentation_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Référence API complète`)
};

const ar_developerportal_guides_hub_resources_documentation_description1 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Documentation_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرجع API كامل`)
};

/**
* | output |
* | --- |
* | "Full API reference" |
*
* @param {Developerportal_Guides_Hub_Resources_Documentation_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_resources_documentation_description1 = /** @type {((inputs?: Developerportal_Guides_Hub_Resources_Documentation_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Resources_Documentation_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_resources_documentation_description1(inputs)
	if (locale === "es") return es_developerportal_guides_hub_resources_documentation_description1(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_resources_documentation_description1(inputs)
	return ar_developerportal_guides_hub_resources_documentation_description1(inputs)
});
export { developerportal_guides_hub_resources_documentation_description1 as "developerPortal.guides.hub.resources.documentation.description" }