/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, error: NonNullable<unknown> }} Toasts_Family_Profilecreatefailed2Inputs */

const en_toasts_family_profilecreatefailed2 = /** @type {(inputs: Toasts_Family_Profilecreatefailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to create "${i?.name}": ${i?.error}`)
};

const es_toasts_family_profilecreatefailed2 = /** @type {(inputs: Toasts_Family_Profilecreatefailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al crear "${i?.name}": ${i?.error}`)
};

const de_toasts_family_profilecreatefailed2 = /** @type {(inputs: Toasts_Family_Profilecreatefailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Fehler beim Erstellen von "${i?.name}": ${i?.error}`)
};

const ar_toasts_family_profilecreatefailed2 = /** @type {(inputs: Toasts_Family_Profilecreatefailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فشل إنشاء "${i?.name}": ${i?.error}`)
};

const fr_toasts_family_profilecreatefailed2 = /** @type {(inputs: Toasts_Family_Profilecreatefailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Échec de la création de "${i?.name}" : ${i?.error}`)
};

const ko_toasts_family_profilecreatefailed2 = /** @type {(inputs: Toasts_Family_Profilecreatefailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`"${i?.name}" 생성 실패: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Failed to create \"{name}\": {error}" |
*
* @param {Toasts_Family_Profilecreatefailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_family_profilecreatefailed2 = /** @type {((inputs: Toasts_Family_Profilecreatefailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Family_Profilecreatefailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_family_profilecreatefailed2(inputs)
	if (locale === "es") return es_toasts_family_profilecreatefailed2(inputs)
	if (locale === "de") return de_toasts_family_profilecreatefailed2(inputs)
	if (locale === "ar") return ar_toasts_family_profilecreatefailed2(inputs)
	if (locale === "fr") return fr_toasts_family_profilecreatefailed2(inputs)
	return ko_toasts_family_profilecreatefailed2(inputs)
});
export { toasts_family_profilecreatefailed2 as "toasts.family.profileCreateFailed" }