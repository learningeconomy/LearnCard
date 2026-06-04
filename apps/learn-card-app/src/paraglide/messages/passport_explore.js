/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_ExploreInputs */

const en_passport_explore = /** @type {(inputs: Passport_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore`)
};

const es_passport_explore = /** @type {(inputs: Passport_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar`)
};

const de_passport_explore = /** @type {(inputs: Passport_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entdecken`)
};

const ar_passport_explore = /** @type {(inputs: Passport_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف`)
};

const fr_passport_explore = /** @type {(inputs: Passport_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer`)
};

const ko_passport_explore = /** @type {(inputs: Passport_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`탐색`)
};

/**
* | output |
* | --- |
* | "Explore" |
*
* @param {Passport_ExploreInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const passport_explore = /** @type {((inputs?: Passport_ExploreInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_ExploreInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_explore(inputs)
	if (locale === "es") return es_passport_explore(inputs)
	if (locale === "de") return de_passport_explore(inputs)
	if (locale === "ar") return ar_passport_explore(inputs)
	if (locale === "fr") return fr_passport_explore(inputs)
	return ko_passport_explore(inputs)
});
export { passport_explore as "passport.explore" }