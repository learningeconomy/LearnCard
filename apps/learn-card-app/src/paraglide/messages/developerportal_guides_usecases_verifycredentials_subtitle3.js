/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Usecases_Verifycredentials_Subtitle3Inputs */

const en_developerportal_guides_usecases_verifycredentials_subtitle3 = /** @type {(inputs: Developerportal_Guides_Usecases_Verifycredentials_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept VCs from users`)
};

const es_developerportal_guides_usecases_verifycredentials_subtitle3 = /** @type {(inputs: Developerportal_Guides_Usecases_Verifycredentials_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept VCs from users`)
};

const fr_developerportal_guides_usecases_verifycredentials_subtitle3 = /** @type {(inputs: Developerportal_Guides_Usecases_Verifycredentials_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept VCs from users`)
};

const ar_developerportal_guides_usecases_verifycredentials_subtitle3 = /** @type {(inputs: Developerportal_Guides_Usecases_Verifycredentials_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept VCs from users`)
};

/**
* | output |
* | --- |
* | "Accept VCs from users" |
*
* @param {Developerportal_Guides_Usecases_Verifycredentials_Subtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_usecases_verifycredentials_subtitle3 = /** @type {((inputs?: Developerportal_Guides_Usecases_Verifycredentials_Subtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Usecases_Verifycredentials_Subtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_usecases_verifycredentials_subtitle3(inputs)
	if (locale === "es") return es_developerportal_guides_usecases_verifycredentials_subtitle3(inputs)
	if (locale === "fr") return fr_developerportal_guides_usecases_verifycredentials_subtitle3(inputs)
	return ar_developerportal_guides_usecases_verifycredentials_subtitle3(inputs)
});
export { developerportal_guides_usecases_verifycredentials_subtitle3 as "developerPortal.guides.useCases.verifyCredentials.subtitle" }