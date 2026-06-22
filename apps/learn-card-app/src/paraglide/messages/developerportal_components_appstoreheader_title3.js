/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appstoreheader_Title3Inputs */

const en_developerportal_components_appstoreheader_title3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Store Portal`)
};

const es_developerportal_components_appstoreheader_title3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portal de la Tienda de Apps`)
};

const fr_developerportal_components_appstoreheader_title3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portail de l'App Store`)
};

const ar_developerportal_components_appstoreheader_title3 = /** @type {(inputs: Developerportal_Components_Appstoreheader_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بوابة متجر التطبيقات`)
};

/**
* | output |
* | --- |
* | "App Store Portal" |
*
* @param {Developerportal_Components_Appstoreheader_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appstoreheader_title3 = /** @type {((inputs?: Developerportal_Components_Appstoreheader_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appstoreheader_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appstoreheader_title3(inputs)
	if (locale === "es") return es_developerportal_components_appstoreheader_title3(inputs)
	if (locale === "fr") return fr_developerportal_components_appstoreheader_title3(inputs)
	return ar_developerportal_components_appstoreheader_title3(inputs)
});
export { developerportal_components_appstoreheader_title3 as "developerPortal.components.appStoreHeader.title" }