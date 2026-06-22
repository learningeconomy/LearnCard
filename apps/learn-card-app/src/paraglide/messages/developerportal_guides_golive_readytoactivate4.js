/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Readytoactivate4Inputs */

const en_developerportal_guides_golive_readytoactivate4 = /** @type {(inputs: Developerportal_Guides_Golive_Readytoactivate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to activate`)
};

const es_developerportal_guides_golive_readytoactivate4 = /** @type {(inputs: Developerportal_Guides_Golive_Readytoactivate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listo para activar`)
};

const fr_developerportal_guides_golive_readytoactivate4 = /** @type {(inputs: Developerportal_Guides_Golive_Readytoactivate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt à activer`)
};

const ar_developerportal_guides_golive_readytoactivate4 = /** @type {(inputs: Developerportal_Guides_Golive_Readytoactivate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاهز للتفعيل`)
};

/**
* | output |
* | --- |
* | "Ready to activate" |
*
* @param {Developerportal_Guides_Golive_Readytoactivate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_readytoactivate4 = /** @type {((inputs?: Developerportal_Guides_Golive_Readytoactivate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Readytoactivate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_readytoactivate4(inputs)
	if (locale === "es") return es_developerportal_guides_golive_readytoactivate4(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_readytoactivate4(inputs)
	return ar_developerportal_guides_golive_readytoactivate4(inputs)
});
export { developerportal_guides_golive_readytoactivate4 as "developerPortal.guides.goLive.readyToActivate" }