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

const de_profile_close = /** @type {(inputs: Profile_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schließen`)
};

const ar_profile_close = /** @type {(inputs: Profile_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يغلق`)
};

const fr_profile_close = /** @type {(inputs: Profile_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ko_profile_close = /** @type {(inputs: Profile_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`닫다`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Profile_CloseInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_close = /** @type {((inputs?: Profile_CloseInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_CloseInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_close(inputs)
	if (locale === "es") return es_profile_close(inputs)
	if (locale === "de") return de_profile_close(inputs)
	if (locale === "ar") return ar_profile_close(inputs)
	if (locale === "fr") return fr_profile_close(inputs)
	return ko_profile_close(inputs)
});
export { profile_close as "profile.close" }