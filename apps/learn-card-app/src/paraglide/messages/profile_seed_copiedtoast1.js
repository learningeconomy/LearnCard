/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Seed_Copiedtoast1Inputs */

const en_profile_seed_copiedtoast1 = /** @type {(inputs: Profile_Seed_Copiedtoast1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seed Phrase copied to clipboard`)
};

const es_profile_seed_copiedtoast1 = /** @type {(inputs: Profile_Seed_Copiedtoast1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frase semilla copiada al portapapeles`)
};

const fr_profile_seed_copiedtoast1 = /** @type {(inputs: Profile_Seed_Copiedtoast1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase seed copiée dans le presse-papiers`)
};

const ar_profile_seed_copiedtoast1 = /** @type {(inputs: Profile_Seed_Copiedtoast1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ عبارة البذرة إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Seed Phrase copied to clipboard" |
*
* @param {Profile_Seed_Copiedtoast1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_seed_copiedtoast1 = /** @type {((inputs?: Profile_Seed_Copiedtoast1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_Copiedtoast1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_copiedtoast1(inputs)
	if (locale === "es") return es_profile_seed_copiedtoast1(inputs)
	if (locale === "fr") return fr_profile_seed_copiedtoast1(inputs)
	return ar_profile_seed_copiedtoast1(inputs)
});
export { profile_seed_copiedtoast1 as "profile.seed.copiedToast" }