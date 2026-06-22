/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Validation_Namerequired2Inputs */

const en_createprofile_validation_namerequired2 = /** @type {(inputs: Createprofile_Validation_Namerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name is required.`)
};

const es_createprofile_validation_namerequired2 = /** @type {(inputs: Createprofile_Validation_Namerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El nombre es obligatorio.`)
};

const fr_createprofile_validation_namerequired2 = /** @type {(inputs: Createprofile_Validation_Namerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le nom est obligatoire.`)
};

const ar_createprofile_validation_namerequired2 = /** @type {(inputs: Createprofile_Validation_Namerequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم مطلوب.`)
};

/**
* | output |
* | --- |
* | "Name is required." |
*
* @param {Createprofile_Validation_Namerequired2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_validation_namerequired2 = /** @type {((inputs?: Createprofile_Validation_Namerequired2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Validation_Namerequired2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_validation_namerequired2(inputs)
	if (locale === "es") return es_createprofile_validation_namerequired2(inputs)
	if (locale === "fr") return fr_createprofile_validation_namerequired2(inputs)
	return ar_createprofile_validation_namerequired2(inputs)
});
export { createprofile_validation_namerequired2 as "createProfile.validation.nameRequired" }