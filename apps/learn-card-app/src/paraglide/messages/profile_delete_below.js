/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Delete_BelowInputs */

const en_profile_delete_below = /** @type {(inputs: Profile_Delete_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`below.`)
};

const es_profile_delete_below = /** @type {(inputs: Profile_Delete_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`abajo.`)
};

const de_profile_delete_below = /** @type {(inputs: Profile_Delete_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`unten.`)
};

const ar_profile_delete_below = /** @type {(inputs: Profile_Delete_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أقل.`)
};

const fr_profile_delete_below = /** @type {(inputs: Profile_Delete_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ci-dessous.`)
};

const ko_profile_delete_below = /** @type {(inputs: Profile_Delete_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아래에.`)
};

/**
* | output |
* | --- |
* | "below." |
*
* @param {Profile_Delete_BelowInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_delete_below = /** @type {((inputs?: Profile_Delete_BelowInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_BelowInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_below(inputs)
	if (locale === "es") return es_profile_delete_below(inputs)
	if (locale === "de") return de_profile_delete_below(inputs)
	if (locale === "ar") return ar_profile_delete_below(inputs)
	if (locale === "fr") return fr_profile_delete_below(inputs)
	return ko_profile_delete_below(inputs)
});
export { profile_delete_below as "profile.delete.below" }