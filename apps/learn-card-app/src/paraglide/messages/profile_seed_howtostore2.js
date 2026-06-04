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

const de_profile_seed_howtostore2 = /** @type {(inputs: Profile_Seed_Howtostore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wie speicherst du deine Seed-Phrase sicher?`)
};

const ar_profile_seed_howtostore2 = /** @type {(inputs: Profile_Seed_Howtostore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيف تخزن عبارة البذرة بأمان؟`)
};

const fr_profile_seed_howtostore2 = /** @type {(inputs: Profile_Seed_Howtostore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment stocker votre phrase seed en toute sécurité ?`)
};

const ko_profile_seed_howtostore2 = /** @type {(inputs: Profile_Seed_Howtostore2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시드 구문을 안전하게 보관하는 방법?`)
};

/**
* | output |
* | --- |
* | "How to store your seed phrase safely?" |
*
* @param {Profile_Seed_Howtostore2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_seed_howtostore2 = /** @type {((inputs?: Profile_Seed_Howtostore2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_Howtostore2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_howtostore2(inputs)
	if (locale === "es") return es_profile_seed_howtostore2(inputs)
	if (locale === "de") return de_profile_seed_howtostore2(inputs)
	if (locale === "ar") return ar_profile_seed_howtostore2(inputs)
	if (locale === "fr") return fr_profile_seed_howtostore2(inputs)
	return ko_profile_seed_howtostore2(inputs)
});
export { profile_seed_howtostore2 as "profile.seed.howToStore" }