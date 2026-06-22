/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Defaulttitle3Inputs */

const en_developerportal_guides_golive_defaulttitle3 = /** @type {(inputs: Developerportal_Guides_Golive_Defaulttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to Go Live!`)
};

const es_developerportal_guides_golive_defaulttitle3 = /** @type {(inputs: Developerportal_Guides_Golive_Defaulttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Listo para Publicar!`)
};

const fr_developerportal_guides_golive_defaulttitle3 = /** @type {(inputs: Developerportal_Guides_Golive_Defaulttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt à Être Mis en Ligne !`)
};

const ar_developerportal_guides_golive_defaulttitle3 = /** @type {(inputs: Developerportal_Guides_Golive_Defaulttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاهز للنشر!`)
};

/**
* | output |
* | --- |
* | "Ready to Go Live!" |
*
* @param {Developerportal_Guides_Golive_Defaulttitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_defaulttitle3 = /** @type {((inputs?: Developerportal_Guides_Golive_Defaulttitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Defaulttitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_defaulttitle3(inputs)
	if (locale === "es") return es_developerportal_guides_golive_defaulttitle3(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_defaulttitle3(inputs)
	return ar_developerportal_guides_golive_defaulttitle3(inputs)
});
export { developerportal_guides_golive_defaulttitle3 as "developerPortal.guides.goLive.defaultTitle" }