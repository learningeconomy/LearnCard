/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Fullname2Inputs */

const en_userprofile_fullname2 = /** @type {(inputs: Userprofile_Fullname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Name`)
};

const es_userprofile_fullname2 = /** @type {(inputs: Userprofile_Fullname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre Completo`)
};

const fr_userprofile_fullname2 = /** @type {(inputs: Userprofile_Fullname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom complet`)
};

const ar_userprofile_fullname2 = /** @type {(inputs: Userprofile_Fullname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Name`)
};

/**
* | output |
* | --- |
* | "Full Name" |
*
* @param {Userprofile_Fullname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_fullname2 = /** @type {((inputs?: Userprofile_Fullname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Fullname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_fullname2(inputs)
	if (locale === "es") return es_userprofile_fullname2(inputs)
	if (locale === "fr") return fr_userprofile_fullname2(inputs)
	return ar_userprofile_fullname2(inputs)
});
export { userprofile_fullname2 as "userProfile.fullName" }