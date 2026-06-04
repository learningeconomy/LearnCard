/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Seed_Copyconfirm1Inputs */

const en_profile_seed_copyconfirm1 = /** @type {(inputs: Profile_Seed_Copyconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to copy this to clipboard?`)
};

const es_profile_seed_copyconfirm1 = /** @type {(inputs: Profile_Seed_Copyconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas copiar esto al portapapeles?`)
};

const de_profile_seed_copyconfirm1 = /** @type {(inputs: Profile_Seed_Copyconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bist du sicher, dass du dies in die Zwischenablage kopieren möchtest?`)
};

const ar_profile_seed_copyconfirm1 = /** @type {(inputs: Profile_Seed_Copyconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد نسخ هذا إلى الحافظة؟`)
};

const fr_profile_seed_copyconfirm1 = /** @type {(inputs: Profile_Seed_Copyconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir copier ceci dans le presse-papiers ?`)
};

const ko_profile_seed_copyconfirm1 = /** @type {(inputs: Profile_Seed_Copyconfirm1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 항목을 클립보드에 복사하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to copy this to clipboard?" |
*
* @param {Profile_Seed_Copyconfirm1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_seed_copyconfirm1 = /** @type {((inputs?: Profile_Seed_Copyconfirm1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Seed_Copyconfirm1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_seed_copyconfirm1(inputs)
	if (locale === "es") return es_profile_seed_copyconfirm1(inputs)
	if (locale === "de") return de_profile_seed_copyconfirm1(inputs)
	if (locale === "ar") return ar_profile_seed_copyconfirm1(inputs)
	if (locale === "fr") return fr_profile_seed_copyconfirm1(inputs)
	return ko_profile_seed_copyconfirm1(inputs)
});
export { profile_seed_copyconfirm1 as "profile.seed.copyConfirm" }