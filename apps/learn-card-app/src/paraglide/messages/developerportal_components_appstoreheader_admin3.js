/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appstoreheader_Admin3Inputs */

const en_developerportal_components_appstoreheader_admin3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Admin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin`)
};

const es_developerportal_components_appstoreheader_admin3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Admin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin`)
};

const fr_developerportal_components_appstoreheader_admin3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Admin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin`)
};

const ar_developerportal_components_appstoreheader_admin3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Admin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مدير`)
};

/**
* | output |
* | --- |
* | "Admin" |
*
* @param {Developerportal_Components_Appstoreheader_Admin3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appstoreheader_admin3 = /** @type {((inputs?: Developerportal_Components_Appstoreheader_Admin3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appstoreheader_Admin3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appstoreheader_admin3(inputs)
	if (locale === "es") return es_developerportal_components_appstoreheader_admin3(inputs)
	if (locale === "fr") return fr_developerportal_components_appstoreheader_admin3(inputs)
	return ar_developerportal_components_appstoreheader_admin3(inputs)
});
export { developerportal_components_appstoreheader_admin3 as "developerPortal.components.appStoreHeader.admin" }