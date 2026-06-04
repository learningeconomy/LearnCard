/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_SavingInputs */

const en_profile_saving = /** @type {(inputs: Profile_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_profile_saving = /** @type {(inputs: Profile_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ahorro...`)
};

const de_profile_saving = /** @type {(inputs: Profile_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sparen...`)
};

const ar_profile_saving = /** @type {(inputs: Profile_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توفير...`)
};

const fr_profile_saving = /** @type {(inputs: Profile_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Économie...`)
};

const ko_profile_saving = /** @type {(inputs: Profile_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`절약...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Profile_SavingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_saving = /** @type {((inputs?: Profile_SavingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_SavingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_saving(inputs)
	if (locale === "es") return es_profile_saving(inputs)
	if (locale === "de") return de_profile_saving(inputs)
	if (locale === "ar") return ar_profile_saving(inputs)
	if (locale === "fr") return fr_profile_saving(inputs)
	return ko_profile_saving(inputs)
});
export { profile_saving as "profile.saving" }