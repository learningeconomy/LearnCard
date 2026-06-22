/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appstoreheader_Developer3Inputs */

const en_developerportal_components_appstoreheader_developer3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Developer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer`)
};

const es_developerportal_components_appstoreheader_developer3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Developer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desarrollador`)
};

const fr_developerportal_components_appstoreheader_developer3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Developer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développeur`)
};

const ar_developerportal_components_appstoreheader_developer3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Developer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطور`)
};

/**
* | output |
* | --- |
* | "Developer" |
*
* @param {Developerportal_Components_Appstoreheader_Developer3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appstoreheader_developer3 = /** @type {((inputs?: Developerportal_Components_Appstoreheader_Developer3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appstoreheader_Developer3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appstoreheader_developer3(inputs)
	if (locale === "es") return es_developerportal_components_appstoreheader_developer3(inputs)
	if (locale === "fr") return fr_developerportal_components_appstoreheader_developer3(inputs)
	return ar_developerportal_components_appstoreheader_developer3(inputs)
});
export { developerportal_components_appstoreheader_developer3 as "developerPortal.components.appStoreHeader.developer" }