/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Seed_Copyfailedtoast2Inputs */

const en_profile_seed_copyfailedtoast2 = /** @type {(inputs: Profile_Seed_Copyfailedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy seed phrase to clipboard`)
};

const es_profile_seed_copyfailedtoast2 = /** @type {(inputs: Profile_Seed_Copyfailedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar la frase semilla al portapapeles`)
};

const fr_profile_seed_copyfailedtoast2 = /** @type {(inputs: Profile_Seed_Copyfailedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier la phrase seed dans le presse-papiers`)
};

const ar_profile_seed_copyfailedtoast2 = /** @type {(inputs: Profile_Seed_Copyfailedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ عبارة البذرة إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy seed phrase to clipboard" |
*
* @param {Profile_Seed_Copyfailedtoast2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_seed_copyfailedtoast2 = /** @type {((inputs?: Profile_Seed_Copyfailedtoast2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_Copyfailedtoast2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_copyfailedtoast2(inputs)
	if (locale === "es") return es_profile_seed_copyfailedtoast2(inputs)
	if (locale === "fr") return fr_profile_seed_copyfailedtoast2(inputs)
	return ar_profile_seed_copyfailedtoast2(inputs)
});
export { profile_seed_copyfailedtoast2 as "profile.seed.copyFailedToast" }