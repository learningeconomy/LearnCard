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

const de_profile_save = /** @type {(inputs: Profile_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichern`)
};

const ar_profile_save = /** @type {(inputs: Profile_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحفظ`)
};

const fr_profile_save = /** @type {(inputs: Profile_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarder`)
};

const ko_profile_save = /** @type {(inputs: Profile_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`구하다`)
};

/**
* | output |
* | --- |
* | "Save" |
*
* @param {Profile_SaveInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_save = /** @type {((inputs?: Profile_SaveInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_SaveInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_save(inputs)
	if (locale === "es") return es_profile_save(inputs)
	if (locale === "de") return de_profile_save(inputs)
	if (locale === "ar") return ar_profile_save(inputs)
	if (locale === "fr") return fr_profile_save(inputs)
	return ko_profile_save(inputs)
});
export { profile_save as "profile.save" }