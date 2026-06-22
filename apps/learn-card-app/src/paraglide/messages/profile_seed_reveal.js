/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Seed_RevealInputs */

const en_profile_seed_reveal = /** @type {(inputs: Profile_Seed_RevealInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reveal My Seed`)
};

const es_profile_seed_reveal = /** @type {(inputs: Profile_Seed_RevealInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revelar mi semilla`)
};

const fr_profile_seed_reveal = /** @type {(inputs: Profile_Seed_RevealInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révéler ma seed`)
};

const ar_profile_seed_reveal = /** @type {(inputs: Profile_Seed_RevealInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كشف بذرتي`)
};

/**
* | output |
* | --- |
* | "Reveal My Seed" |
*
* @param {Profile_Seed_RevealInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_seed_reveal = /** @type {((inputs?: Profile_Seed_RevealInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_RevealInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_reveal(inputs)
	if (locale === "es") return es_profile_seed_reveal(inputs)
	if (locale === "fr") return fr_profile_seed_reveal(inputs)
	return ar_profile_seed_reveal(inputs)
});
export { profile_seed_reveal as "profile.seed.reveal" }