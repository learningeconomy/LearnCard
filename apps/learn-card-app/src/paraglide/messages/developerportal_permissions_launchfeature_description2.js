/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Permissions_Launchfeature_Description2Inputs */

const en_developerportal_permissions_launchfeature_description2 = /** @type {(inputs: Developerportal_Permissions_Launchfeature_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch wallet features programmatically`)
};

const es_developerportal_permissions_launchfeature_description2 = /** @type {(inputs: Developerportal_Permissions_Launchfeature_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch wallet features programmatically`)
};

const fr_developerportal_permissions_launchfeature_description2 = /** @type {(inputs: Developerportal_Permissions_Launchfeature_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch wallet features programmatically`)
};

const ar_developerportal_permissions_launchfeature_description2 = /** @type {(inputs: Developerportal_Permissions_Launchfeature_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch wallet features programmatically`)
};

/**
* | output |
* | --- |
* | "Launch wallet features programmatically" |
*
* @param {Developerportal_Permissions_Launchfeature_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_permissions_launchfeature_description2 = /** @type {((inputs?: Developerportal_Permissions_Launchfeature_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Permissions_Launchfeature_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_permissions_launchfeature_description2(inputs)
	if (locale === "es") return es_developerportal_permissions_launchfeature_description2(inputs)
	if (locale === "fr") return fr_developerportal_permissions_launchfeature_description2(inputs)
	return ar_developerportal_permissions_launchfeature_description2(inputs)
});
export { developerportal_permissions_launchfeature_description2 as "developerPortal.permissions.launchFeature.description" }