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

const fr_profile_delete_below = /** @type {(inputs: Profile_Delete_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ci-dessous.`)
};

const ar_profile_delete_below = /** @type {(inputs: Profile_Delete_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أقل.`)
};

/**
* | output |
* | --- |
* | "below." |
*
* @param {Profile_Delete_BelowInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_delete_below = /** @type {((inputs?: Profile_Delete_BelowInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_BelowInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_below(inputs)
	if (locale === "es") return es_profile_delete_below(inputs)
	if (locale === "fr") return fr_profile_delete_below(inputs)
	return ar_profile_delete_below(inputs)
});
export { profile_delete_below as "profile.delete.below" }