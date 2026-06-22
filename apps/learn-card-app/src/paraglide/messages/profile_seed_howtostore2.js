/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Seed_Howtostore2Inputs */

const en_profile_seed_howtostore2 = /** @type {(inputs: Profile_Seed_Howtostore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How to store your seed phrase safely?`)
};

const es_profile_seed_howtostore2 = /** @type {(inputs: Profile_Seed_Howtostore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cómo guardar tu frase semilla de forma segura?`)
};

const fr_profile_seed_howtostore2 = /** @type {(inputs: Profile_Seed_Howtostore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment stocker votre phrase seed en toute sécurité ?`)
};

const ar_profile_seed_howtostore2 = /** @type {(inputs: Profile_Seed_Howtostore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيف تخزن عبارة البذرة بأمان؟`)
};

/**
* | output |
* | --- |
* | "How to store your seed phrase safely?" |
*
* @param {Profile_Seed_Howtostore2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_seed_howtostore2 = /** @type {((inputs?: Profile_Seed_Howtostore2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_Howtostore2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_howtostore2(inputs)
	if (locale === "es") return es_profile_seed_howtostore2(inputs)
	if (locale === "fr") return fr_profile_seed_howtostore2(inputs)
	return ar_profile_seed_howtostore2(inputs)
});
export { profile_seed_howtostore2 as "profile.seed.howToStore" }