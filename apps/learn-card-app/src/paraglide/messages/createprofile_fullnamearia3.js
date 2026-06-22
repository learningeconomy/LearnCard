/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Fullnamearia3Inputs */

const en_createprofile_fullnamearia3 = /** @type {(inputs: Createprofile_Fullnamearia3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Name`)
};

const es_createprofile_fullnamearia3 = /** @type {(inputs: Createprofile_Fullnamearia3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre completo`)
};

const fr_createprofile_fullnamearia3 = /** @type {(inputs: Createprofile_Fullnamearia3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom complet`)
};

const ar_createprofile_fullnamearia3 = /** @type {(inputs: Createprofile_Fullnamearia3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم الكامل`)
};

/**
* | output |
* | --- |
* | "Full Name" |
*
* @param {Createprofile_Fullnamearia3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_fullnamearia3 = /** @type {((inputs?: Createprofile_Fullnamearia3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Fullnamearia3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_fullnamearia3(inputs)
	if (locale === "es") return es_createprofile_fullnamearia3(inputs)
	if (locale === "fr") return fr_createprofile_fullnamearia3(inputs)
	return ar_createprofile_fullnamearia3(inputs)
});
export { createprofile_fullnamearia3 as "createProfile.fullNameAria" }