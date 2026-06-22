/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Organizationtitle2Inputs */

const en_createprofile_organizationtitle2 = /** @type {(inputs: Createprofile_Organizationtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Organization`)
};

const es_createprofile_organizationtitle2 = /** @type {(inputs: Createprofile_Organizationtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear nueva organización`)
};

const fr_createprofile_organizationtitle2 = /** @type {(inputs: Createprofile_Organizationtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une nouvelle organisation`)
};

const ar_createprofile_organizationtitle2 = /** @type {(inputs: Createprofile_Organizationtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء مؤسسة جديدة`)
};

/**
* | output |
* | --- |
* | "Create New Organization" |
*
* @param {Createprofile_Organizationtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_organizationtitle2 = /** @type {((inputs?: Createprofile_Organizationtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Organizationtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_organizationtitle2(inputs)
	if (locale === "es") return es_createprofile_organizationtitle2(inputs)
	if (locale === "fr") return fr_createprofile_organizationtitle2(inputs)
	return ar_createprofile_organizationtitle2(inputs)
});
export { createprofile_organizationtitle2 as "createProfile.organizationTitle" }