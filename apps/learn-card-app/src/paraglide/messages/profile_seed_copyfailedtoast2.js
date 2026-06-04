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

const de_profile_seed_copyfailedtoast2 = /** @type {(inputs: Profile_Seed_Copyfailedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seed-Phrase konnte nicht in die Zwischenablage kopiert werden`)
};

const ar_profile_seed_copyfailedtoast2 = /** @type {(inputs: Profile_Seed_Copyfailedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ عبارة البذرة إلى الحافظة`)
};

const fr_profile_seed_copyfailedtoast2 = /** @type {(inputs: Profile_Seed_Copyfailedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier la phrase seed dans le presse-papiers`)
};

const ko_profile_seed_copyfailedtoast2 = /** @type {(inputs: Profile_Seed_Copyfailedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시드 구문을 클립보드에 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy seed phrase to clipboard" |
*
* @param {Profile_Seed_Copyfailedtoast2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_seed_copyfailedtoast2 = /** @type {((inputs?: Profile_Seed_Copyfailedtoast2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_Copyfailedtoast2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_copyfailedtoast2(inputs)
	if (locale === "es") return es_profile_seed_copyfailedtoast2(inputs)
	if (locale === "de") return de_profile_seed_copyfailedtoast2(inputs)
	if (locale === "ar") return ar_profile_seed_copyfailedtoast2(inputs)
	if (locale === "fr") return fr_profile_seed_copyfailedtoast2(inputs)
	return ko_profile_seed_copyfailedtoast2(inputs)
});
export { profile_seed_copyfailedtoast2 as "profile.seed.copyFailedToast" }