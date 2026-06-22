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

const fr_profile_title = /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon compte`)
};

const ar_profile_title = /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسابي`)
};

/**
* | output |
* | --- |
* | "My Account" |
*
* @param {Profile_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_title = /** @type {((inputs?: Profile_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_title(inputs)
	if (locale === "es") return es_profile_title(inputs)
	if (locale === "fr") return fr_profile_title(inputs)
	return ar_profile_title(inputs)
});
export { profile_title as "profile.title" }