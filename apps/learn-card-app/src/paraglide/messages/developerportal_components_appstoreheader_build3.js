/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appstoreheader_Build3Inputs */

const en_developerportal_components_appstoreheader_build3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Build3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build`)
};

const es_developerportal_components_appstoreheader_build3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Build3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desarrollar`)
};

const fr_developerportal_components_appstoreheader_build3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Build3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développer`)
};

const ar_developerportal_components_appstoreheader_build3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Build3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بناء`)
};

/**
* | output |
* | --- |
* | "Build" |
*
* @param {Developerportal_Components_Appstoreheader_Build3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appstoreheader_build3 = /** @type {((inputs?: Developerportal_Components_Appstoreheader_Build3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appstoreheader_Build3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appstoreheader_build3(inputs)
	if (locale === "es") return es_developerportal_components_appstoreheader_build3(inputs)
	if (locale === "fr") return fr_developerportal_components_appstoreheader_build3(inputs)
	return ar_developerportal_components_appstoreheader_build3(inputs)
});
export { developerportal_components_appstoreheader_build3 as "developerPortal.components.appStoreHeader.build" }