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

const fr_toasts_family_profilecreated1 = /** @type {(inputs: Toasts_Family_Profilecreated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Profil "${i?.name}" créé avec succès !`)
};

const ar_toasts_family_profilecreated1 = /** @type {(inputs: Toasts_Family_Profilecreated1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم إنشاء الملف الشخصي "${i?.name}" بنجاح!`)
};

/**
* | output |
* | --- |
* | "Profile \"{name}\" created successfully!" |
*
* @param {Toasts_Family_Profilecreated1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_family_profilecreated1 = /** @type {((inputs: Toasts_Family_Profilecreated1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Family_Profilecreated1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_family_profilecreated1(inputs)
	if (locale === "es") return es_toasts_family_profilecreated1(inputs)
	if (locale === "fr") return fr_toasts_family_profilecreated1(inputs)
	return ar_toasts_family_profilecreated1(inputs)
});
export { toasts_family_profilecreated1 as "toasts.family.profileCreated" }