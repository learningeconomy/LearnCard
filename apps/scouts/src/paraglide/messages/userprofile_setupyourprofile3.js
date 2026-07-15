/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Setupyourprofile3Inputs */

const en_userprofile_setupyourprofile3 = /** @type {(inputs: Userprofile_Setupyourprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Setup Your Profile`)
};

const es_userprofile_setupyourprofile3 = /** @type {(inputs: Userprofile_Setupyourprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura Tu Perfil`)
};

const fr_userprofile_setupyourprofile3 = /** @type {(inputs: Userprofile_Setupyourprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer votre profil`)
};

const ar_userprofile_setupyourprofile3 = /** @type {(inputs: Userprofile_Setupyourprofile3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد ملفك الشخصي`)
};

/**
* | output |
* | --- |
* | "Setup Your Profile" |
*
* @param {Userprofile_Setupyourprofile3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_setupyourprofile3 = /** @type {((inputs?: Userprofile_Setupyourprofile3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Setupyourprofile3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_setupyourprofile3(inputs)
	if (locale === "es") return es_userprofile_setupyourprofile3(inputs)
	if (locale === "fr") return fr_userprofile_setupyourprofile3(inputs)
	return ar_userprofile_setupyourprofile3(inputs)
});
export { userprofile_setupyourprofile3 as "userProfile.setupYourProfile" }