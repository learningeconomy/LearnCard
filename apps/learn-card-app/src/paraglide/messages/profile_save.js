/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_SaveInputs */

const en_profile_save = /** @type {(inputs: Profile_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save`)
};

const es_profile_save = /** @type {(inputs: Profile_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ahorrar`)
};

const fr_profile_save = /** @type {(inputs: Profile_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarder`)
};

const ar_profile_save = /** @type {(inputs: Profile_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحفظ`)
};

/**
* | output |
* | --- |
* | "Save" |
*
* @param {Profile_SaveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_save = /** @type {((inputs?: Profile_SaveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_SaveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_save(inputs)
	if (locale === "es") return es_profile_save(inputs)
	if (locale === "fr") return fr_profile_save(inputs)
	return ar_profile_save(inputs)
});
export { profile_save as "profile.save" }