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

const fr_profile_saving = /** @type {(inputs: Profile_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Économie...`)
};

const ar_profile_saving = /** @type {(inputs: Profile_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توفير...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Profile_SavingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_saving = /** @type {((inputs?: Profile_SavingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_SavingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_saving(inputs)
	if (locale === "es") return es_profile_saving(inputs)
	if (locale === "fr") return fr_profile_saving(inputs)
	return ar_profile_saving(inputs)
});
export { profile_saving as "profile.saving" }