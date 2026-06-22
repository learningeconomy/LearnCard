/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Activating2Inputs */

const en_developerportal_guides_golive_activating2 = /** @type {(inputs: Developerportal_Guides_Golive_Activating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activating...`)
};

const es_developerportal_guides_golive_activating2 = /** @type {(inputs: Developerportal_Guides_Golive_Activating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activando...`)
};

const fr_developerportal_guides_golive_activating2 = /** @type {(inputs: Developerportal_Guides_Golive_Activating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activation...`)
};

const ar_developerportal_guides_golive_activating2 = /** @type {(inputs: Developerportal_Guides_Golive_Activating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التفعيل...`)
};

/**
* | output |
* | --- |
* | "Activating..." |
*
* @param {Developerportal_Guides_Golive_Activating2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_activating2 = /** @type {((inputs?: Developerportal_Guides_Golive_Activating2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Activating2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_activating2(inputs)
	if (locale === "es") return es_developerportal_guides_golive_activating2(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_activating2(inputs)
	return ar_developerportal_guides_golive_activating2(inputs)
});
export { developerportal_guides_golive_activating2 as "developerPortal.guides.goLive.activating" }