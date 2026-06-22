/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Clicktoupload5Inputs */

const en_developerportal_components_appdetailsstep_clicktoupload5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Clicktoupload5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Click to upload icon`)
};

const es_developerportal_components_appdetailsstep_clicktoupload5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Clicktoupload5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Haz clic para subir el icono`)
};

const fr_developerportal_components_appdetailsstep_clicktoupload5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Clicktoupload5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cliquez pour télécharger l'icône`)
};

const ar_developerportal_components_appdetailsstep_clicktoupload5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Clicktoupload5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انقر لرفع الأيقونة`)
};

/**
* | output |
* | --- |
* | "Click to upload icon" |
*
* @param {Developerportal_Components_Appdetailsstep_Clicktoupload5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_clicktoupload5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Clicktoupload5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Clicktoupload5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_clicktoupload5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_clicktoupload5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_clicktoupload5(inputs)
	return ar_developerportal_components_appdetailsstep_clicktoupload5(inputs)
});
export { developerportal_components_appdetailsstep_clicktoupload5 as "developerPortal.components.appDetailsStep.clickToUpload" }