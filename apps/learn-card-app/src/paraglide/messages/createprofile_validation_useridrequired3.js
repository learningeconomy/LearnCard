/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Validation_Useridrequired3Inputs */

const en_createprofile_validation_useridrequired3 = /** @type {(inputs: Createprofile_Validation_Useridrequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User ID is required.`)
};

const es_createprofile_validation_useridrequired3 = /** @type {(inputs: Createprofile_Validation_Useridrequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El ID de usuario es obligatorio.`)
};

const fr_createprofile_validation_useridrequired3 = /** @type {(inputs: Createprofile_Validation_Useridrequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'identifiant utilisateur est obligatoire.`)
};

const ar_createprofile_validation_useridrequired3 = /** @type {(inputs: Createprofile_Validation_Useridrequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرّف المستخدم مطلوب.`)
};

/**
* | output |
* | --- |
* | "User ID is required." |
*
* @param {Createprofile_Validation_Useridrequired3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_validation_useridrequired3 = /** @type {((inputs?: Createprofile_Validation_Useridrequired3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Validation_Useridrequired3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_validation_useridrequired3(inputs)
	if (locale === "es") return es_createprofile_validation_useridrequired3(inputs)
	if (locale === "fr") return fr_createprofile_validation_useridrequired3(inputs)
	return ar_createprofile_validation_useridrequired3(inputs)
});
export { createprofile_validation_useridrequired3 as "createProfile.validation.userIdRequired" }