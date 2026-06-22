/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Appicon4Inputs */

const en_developerportal_components_appdetailsstep_appicon4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Appicon4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Icon`)
};

const es_developerportal_components_appdetailsstep_appicon4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Appicon4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icono de la App`)
};

const fr_developerportal_components_appdetailsstep_appicon4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Appicon4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icône de l'App`)
};

const ar_developerportal_components_appdetailsstep_appicon4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Appicon4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أيقونة التطبيق`)
};

/**
* | output |
* | --- |
* | "App Icon" |
*
* @param {Developerportal_Components_Appdetailsstep_Appicon4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_appicon4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Appicon4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Appicon4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_appicon4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_appicon4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_appicon4(inputs)
	return ar_developerportal_components_appdetailsstep_appicon4(inputs)
});
export { developerportal_components_appdetailsstep_appicon4 as "developerPortal.components.appDetailsStep.appIcon" }