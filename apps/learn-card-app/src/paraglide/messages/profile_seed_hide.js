/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Seed_HideInputs */

const en_profile_seed_hide = /** @type {(inputs: Profile_Seed_HideInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide My Seed`)
};

const es_profile_seed_hide = /** @type {(inputs: Profile_Seed_HideInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocultar mi semilla`)
};

const de_profile_seed_hide = /** @type {(inputs: Profile_Seed_HideInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Meine Seed verbergen`)
};

const ar_profile_seed_hide = /** @type {(inputs: Profile_Seed_HideInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إخفاء بذرتي`)
};

const fr_profile_seed_hide = /** @type {(inputs: Profile_Seed_HideInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masquer ma seed`)
};

const ko_profile_seed_hide = /** @type {(inputs: Profile_Seed_HideInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`내 시드 숨기기`)
};

/**
* | output |
* | --- |
* | "Hide My Seed" |
*
* @param {Profile_Seed_HideInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_seed_hide = /** @type {((inputs?: Profile_Seed_HideInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_HideInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_hide(inputs)
	if (locale === "es") return es_profile_seed_hide(inputs)
	if (locale === "de") return de_profile_seed_hide(inputs)
	if (locale === "ar") return ar_profile_seed_hide(inputs)
	if (locale === "fr") return fr_profile_seed_hide(inputs)
	return ko_profile_seed_hide(inputs)
});
export { profile_seed_hide as "profile.seed.hide" }