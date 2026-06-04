/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_TitleInputs */

const en_profile_title = /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Account`)
};

const es_profile_title = /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi cuenta`)
};

const de_profile_title = /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mein Konto`)
};

const ar_profile_title = /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسابي`)
};

const fr_profile_title = /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon compte`)
};

const ko_profile_title = /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`내 계정`)
};

/**
* | output |
* | --- |
* | "My Account" |
*
* @param {Profile_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_title = /** @type {((inputs?: Profile_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_title(inputs)
	if (locale === "es") return es_profile_title(inputs)
	if (locale === "de") return de_profile_title(inputs)
	if (locale === "ar") return ar_profile_title(inputs)
	if (locale === "fr") return fr_profile_title(inputs)
	return ko_profile_title(inputs)
});
export { profile_title as "profile.title" }