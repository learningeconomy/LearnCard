/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Toasts_Family_Profilecreated1Inputs */

const en_toasts_family_profilecreated1 = /** @type {(inputs: Toasts_Family_Profilecreated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Profile "${i?.name}" created successfully!`)
};

const es_toasts_family_profilecreated1 = /** @type {(inputs: Toasts_Family_Profilecreated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Perfil "${i?.name}" creado exitosamente!`)
};

const de_toasts_family_profilecreated1 = /** @type {(inputs: Toasts_Family_Profilecreated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Profil "${i?.name}" erfolgreich erstellt!`)
};

const ar_toasts_family_profilecreated1 = /** @type {(inputs: Toasts_Family_Profilecreated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم إنشاء الملف الشخصي "${i?.name}" بنجاح!`)
};

const fr_toasts_family_profilecreated1 = /** @type {(inputs: Toasts_Family_Profilecreated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Profil "${i?.name}" créé avec succès !`)
};

const ko_toasts_family_profilecreated1 = /** @type {(inputs: Toasts_Family_Profilecreated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`프로필 "${i?.name}"이(가) 성공적으로 생성되었습니다!`)
};

/**
* | output |
* | --- |
* | "Profile \"{name}\" created successfully!" |
*
* @param {Toasts_Family_Profilecreated1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_family_profilecreated1 = /** @type {((inputs: Toasts_Family_Profilecreated1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Family_Profilecreated1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_family_profilecreated1(inputs)
	if (locale === "es") return es_toasts_family_profilecreated1(inputs)
	if (locale === "de") return de_toasts_family_profilecreated1(inputs)
	if (locale === "ar") return ar_toasts_family_profilecreated1(inputs)
	if (locale === "fr") return fr_toasts_family_profilecreated1(inputs)
	return ko_toasts_family_profilecreated1(inputs)
});
export { toasts_family_profilecreated1 as "toasts.family.profileCreated" }