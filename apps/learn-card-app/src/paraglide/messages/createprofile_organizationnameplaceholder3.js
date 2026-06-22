/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Organizationnameplaceholder3Inputs */

const en_createprofile_organizationnameplaceholder3 = /** @type {(inputs: Createprofile_Organizationnameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization Name`)
};

const es_createprofile_organizationnameplaceholder3 = /** @type {(inputs: Createprofile_Organizationnameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de la organización`)
};

const fr_createprofile_organizationnameplaceholder3 = /** @type {(inputs: Createprofile_Organizationnameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'organisation`)
};

const ar_createprofile_organizationnameplaceholder3 = /** @type {(inputs: Createprofile_Organizationnameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المؤسسة`)
};

/**
* | output |
* | --- |
* | "Organization Name" |
*
* @param {Createprofile_Organizationnameplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_organizationnameplaceholder3 = /** @type {((inputs?: Createprofile_Organizationnameplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Organizationnameplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_organizationnameplaceholder3(inputs)
	if (locale === "es") return es_createprofile_organizationnameplaceholder3(inputs)
	if (locale === "fr") return fr_createprofile_organizationnameplaceholder3(inputs)
	return ar_createprofile_organizationnameplaceholder3(inputs)
});
export { createprofile_organizationnameplaceholder3 as "createProfile.organizationNamePlaceholder" }