/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Resources_Myapps_Description2Inputs */

const en_developerportal_guides_hub_resources_myapps_description2 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Myapps_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage listings`)
};

const es_developerportal_guides_hub_resources_myapps_description2 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Myapps_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar listados`)
};

const fr_developerportal_guides_hub_resources_myapps_description2 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Myapps_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les annonces`)
};

const ar_developerportal_guides_hub_resources_myapps_description2 = /** @type {(inputs: Developerportal_Guides_Hub_Resources_Myapps_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة القوائم`)
};

/**
* | output |
* | --- |
* | "Manage listings" |
*
* @param {Developerportal_Guides_Hub_Resources_Myapps_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_resources_myapps_description2 = /** @type {((inputs?: Developerportal_Guides_Hub_Resources_Myapps_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Resources_Myapps_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_resources_myapps_description2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_resources_myapps_description2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_resources_myapps_description2(inputs)
	return ar_developerportal_guides_hub_resources_myapps_description2(inputs)
});
export { developerportal_guides_hub_resources_myapps_description2 as "developerPortal.guides.hub.resources.myApps.description" }