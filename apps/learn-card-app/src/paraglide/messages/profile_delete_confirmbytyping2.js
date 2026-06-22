/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Delete_Confirmbytyping2Inputs */

const en_profile_delete_confirmbytyping2 = /** @type {(inputs: Profile_Delete_Confirmbytyping2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm by typing`)
};

const es_profile_delete_confirmbytyping2 = /** @type {(inputs: Profile_Delete_Confirmbytyping2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmar escribiendo`)
};

const fr_profile_delete_confirmbytyping2 = /** @type {(inputs: Profile_Delete_Confirmbytyping2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmez en tapant`)
};

const ar_profile_delete_confirmbytyping2 = /** @type {(inputs: Profile_Delete_Confirmbytyping2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بالتأكيد عن طريق الكتابة`)
};

/**
* | output |
* | --- |
* | "Confirm by typing" |
*
* @param {Profile_Delete_Confirmbytyping2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_delete_confirmbytyping2 = /** @type {((inputs?: Profile_Delete_Confirmbytyping2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_Confirmbytyping2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_confirmbytyping2(inputs)
	if (locale === "es") return es_profile_delete_confirmbytyping2(inputs)
	if (locale === "fr") return fr_profile_delete_confirmbytyping2(inputs)
	return ar_profile_delete_confirmbytyping2(inputs)
});
export { profile_delete_confirmbytyping2 as "profile.delete.confirmByTyping" }