/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_CloseInputs */

const en_profile_close = /** @type {(inputs: Profile_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_profile_close = /** @type {(inputs: Profile_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerca`)
};

const fr_profile_close = /** @type {(inputs: Profile_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ar_profile_close = /** @type {(inputs: Profile_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يغلق`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Profile_CloseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_close = /** @type {((inputs?: Profile_CloseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_CloseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_close(inputs)
	if (locale === "es") return es_profile_close(inputs)
	if (locale === "fr") return fr_profile_close(inputs)
	return ar_profile_close(inputs)
});
export { profile_close as "profile.close" }