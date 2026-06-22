/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Iosappstoreid6Inputs */

const en_developerportal_components_appdetailsstep_iosappstoreid6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Iosappstoreid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`iOS App Store ID (e.g., 123456789)`)
};

const es_developerportal_components_appdetailsstep_iosappstoreid6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Iosappstoreid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de App Store iOS (ej., 123456789)`)
};

const fr_developerportal_components_appdetailsstep_iosappstoreid6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Iosappstoreid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID App Store iOS (ex., 123456789)`)
};

const ar_developerportal_components_appdetailsstep_iosappstoreid6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Iosappstoreid6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف متجر تطبيقات iOS (مثال: 123456789)`)
};

/**
* | output |
* | --- |
* | "iOS App Store ID (e.g., 123456789)" |
*
* @param {Developerportal_Components_Appdetailsstep_Iosappstoreid6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_iosappstoreid6 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Iosappstoreid6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Iosappstoreid6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_iosappstoreid6(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_iosappstoreid6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_iosappstoreid6(inputs)
	return ar_developerportal_components_appdetailsstep_iosappstoreid6(inputs)
});
export { developerportal_components_appdetailsstep_iosappstoreid6 as "developerPortal.components.appDetailsStep.iosAppStoreId" }