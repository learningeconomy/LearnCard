/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Headerintegrationselector_Newproject4Inputs */

const en_developerportal_components_headerintegrationselector_newproject4 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Newproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Project`)
};

const es_developerportal_components_headerintegrationselector_newproject4 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Newproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo Proyecto`)
};

const fr_developerportal_components_headerintegrationselector_newproject4 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Newproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau Projet`)
};

const ar_developerportal_components_headerintegrationselector_newproject4 = /** @type {(inputs: Developerportal_Components_Headerintegrationselector_Newproject4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشروع جديد`)
};

/**
* | output |
* | --- |
* | "New Project" |
*
* @param {Developerportal_Components_Headerintegrationselector_Newproject4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_headerintegrationselector_newproject4 = /** @type {((inputs?: Developerportal_Components_Headerintegrationselector_Newproject4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Headerintegrationselector_Newproject4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_headerintegrationselector_newproject4(inputs)
	if (locale === "es") return es_developerportal_components_headerintegrationselector_newproject4(inputs)
	if (locale === "fr") return fr_developerportal_components_headerintegrationselector_newproject4(inputs)
	return ar_developerportal_components_headerintegrationselector_newproject4(inputs)
});
export { developerportal_components_headerintegrationselector_newproject4 as "developerPortal.components.headerIntegrationSelector.newProject" }