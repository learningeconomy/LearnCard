/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Seed_Yourseedphrase2Inputs */

const en_profile_seed_yourseedphrase2 = /** @type {(inputs: Profile_Seed_Yourseedphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Seed Phrase:`)
};

const es_profile_seed_yourseedphrase2 = /** @type {(inputs: Profile_Seed_Yourseedphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu frase semilla:`)
};

const fr_profile_seed_yourseedphrase2 = /** @type {(inputs: Profile_Seed_Yourseedphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre phrase seed :`)
};

const ar_profile_seed_yourseedphrase2 = /** @type {(inputs: Profile_Seed_Yourseedphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عبارة البذرة الخاصة بك:`)
};

/**
* | output |
* | --- |
* | "Your Seed Phrase:" |
*
* @param {Profile_Seed_Yourseedphrase2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_seed_yourseedphrase2 = /** @type {((inputs?: Profile_Seed_Yourseedphrase2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_Yourseedphrase2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_yourseedphrase2(inputs)
	if (locale === "es") return es_profile_seed_yourseedphrase2(inputs)
	if (locale === "fr") return fr_profile_seed_yourseedphrase2(inputs)
	return ar_profile_seed_yourseedphrase2(inputs)
});
export { profile_seed_yourseedphrase2 as "profile.seed.yourSeedPhrase" }