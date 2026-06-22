/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Organizationprofileid3Inputs */

const en_createprofile_organizationprofileid3 = /** @type {(inputs: Createprofile_Organizationprofileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization Profile ID`)
};

const es_createprofile_organizationprofileid3 = /** @type {(inputs: Createprofile_Organizationprofileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de perfil de la organización`)
};

const fr_createprofile_organizationprofileid3 = /** @type {(inputs: Createprofile_Organizationprofileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de profil de l'organisation`)
};

const ar_createprofile_organizationprofileid3 = /** @type {(inputs: Createprofile_Organizationprofileid3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرّف ملف تعريف المؤسسة`)
};

/**
* | output |
* | --- |
* | "Organization Profile ID" |
*
* @param {Createprofile_Organizationprofileid3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_organizationprofileid3 = /** @type {((inputs?: Createprofile_Organizationprofileid3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Organizationprofileid3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_organizationprofileid3(inputs)
	if (locale === "es") return es_createprofile_organizationprofileid3(inputs)
	if (locale === "fr") return fr_createprofile_organizationprofileid3(inputs)
	return ar_createprofile_organizationprofileid3(inputs)
});
export { createprofile_organizationprofileid3 as "createProfile.organizationProfileId" }