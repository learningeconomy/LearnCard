/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appstoreheader_Apps3Inputs */

const en_developerportal_components_appstoreheader_apps3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Apps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const es_developerportal_components_appstoreheader_apps3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Apps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const fr_developerportal_components_appstoreheader_apps3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Apps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const ar_developerportal_components_appstoreheader_apps3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Apps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التطبيقات`)
};

/**
* | output |
* | --- |
* | "Apps" |
*
* @param {Developerportal_Components_Appstoreheader_Apps3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appstoreheader_apps3 = /** @type {((inputs?: Developerportal_Components_Appstoreheader_Apps3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appstoreheader_Apps3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appstoreheader_apps3(inputs)
	if (locale === "es") return es_developerportal_components_appstoreheader_apps3(inputs)
	if (locale === "fr") return fr_developerportal_components_appstoreheader_apps3(inputs)
	return ar_developerportal_components_appstoreheader_apps3(inputs)
});
export { developerportal_components_appstoreheader_apps3 as "developerPortal.components.appStoreHeader.apps" }