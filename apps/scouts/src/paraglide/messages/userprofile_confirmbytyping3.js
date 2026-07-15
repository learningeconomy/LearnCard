/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Confirmbytyping3Inputs */

const en_userprofile_confirmbytyping3 = /** @type {(inputs: Userprofile_Confirmbytyping3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm by typing`)
};

const es_userprofile_confirmbytyping3 = /** @type {(inputs: Userprofile_Confirmbytyping3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirma escribiendo`)
};

const fr_userprofile_confirmbytyping3 = /** @type {(inputs: Userprofile_Confirmbytyping3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmez en tapant`)
};

const ar_userprofile_confirmbytyping3 = /** @type {(inputs: Userprofile_Confirmbytyping3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm by typing`)
};

/**
* | output |
* | --- |
* | "Confirm by typing" |
*
* @param {Userprofile_Confirmbytyping3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_confirmbytyping3 = /** @type {((inputs?: Userprofile_Confirmbytyping3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Confirmbytyping3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_confirmbytyping3(inputs)
	if (locale === "es") return es_userprofile_confirmbytyping3(inputs)
	if (locale === "fr") return fr_userprofile_confirmbytyping3(inputs)
	return ar_userprofile_confirmbytyping3(inputs)
});
export { userprofile_confirmbytyping3 as "userProfile.confirmByTyping" }