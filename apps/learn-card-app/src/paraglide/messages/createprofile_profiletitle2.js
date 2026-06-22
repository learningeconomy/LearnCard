/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Profiletitle2Inputs */

const en_createprofile_profiletitle2 = /** @type {(inputs: Createprofile_Profiletitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a New Profile`)
};

const es_createprofile_profiletitle2 = /** @type {(inputs: Createprofile_Profiletitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear un nuevo perfil`)
};

const fr_createprofile_profiletitle2 = /** @type {(inputs: Createprofile_Profiletitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un nouveau profil`)
};

const ar_createprofile_profiletitle2 = /** @type {(inputs: Createprofile_Profiletitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء ملف تعريف جديد`)
};

/**
* | output |
* | --- |
* | "Create a New Profile" |
*
* @param {Createprofile_Profiletitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_profiletitle2 = /** @type {((inputs?: Createprofile_Profiletitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Profiletitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_profiletitle2(inputs)
	if (locale === "es") return es_createprofile_profiletitle2(inputs)
	if (locale === "fr") return fr_createprofile_profiletitle2(inputs)
	return ar_createprofile_profiletitle2(inputs)
});
export { createprofile_profiletitle2 as "createProfile.profileTitle" }