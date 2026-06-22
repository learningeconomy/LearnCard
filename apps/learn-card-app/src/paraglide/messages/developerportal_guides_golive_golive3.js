/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Golive3Inputs */

const en_developerportal_guides_golive_golive3 = /** @type {(inputs: Developerportal_Guides_Golive_Golive3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go Live`)
};

const es_developerportal_guides_golive_golive3 = /** @type {(inputs: Developerportal_Guides_Golive_Golive3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicar`)
};

const fr_developerportal_guides_golive_golive3 = /** @type {(inputs: Developerportal_Guides_Golive_Golive3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre en Ligne`)
};

const ar_developerportal_guides_golive_golive3 = /** @type {(inputs: Developerportal_Guides_Golive_Golive3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشر`)
};

/**
* | output |
* | --- |
* | "Go Live" |
*
* @param {Developerportal_Guides_Golive_Golive3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_golive3 = /** @type {((inputs?: Developerportal_Guides_Golive_Golive3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Golive3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_golive3(inputs)
	if (locale === "es") return es_developerportal_guides_golive_golive3(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_golive3(inputs)
	return ar_developerportal_guides_golive_golive3(inputs)
});
export { developerportal_guides_golive_golive3 as "developerPortal.guides.goLive.goLive" }