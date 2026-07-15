/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Emailaddress2Inputs */

const en_userprofile_emailaddress2 = /** @type {(inputs: Userprofile_Emailaddress2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email address`)
};

const es_userprofile_emailaddress2 = /** @type {(inputs: Userprofile_Emailaddress2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dirección de correo`)
};

const fr_userprofile_emailaddress2 = /** @type {(inputs: Userprofile_Emailaddress2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adresse e-mail`)
};

const ar_userprofile_emailaddress2 = /** @type {(inputs: Userprofile_Emailaddress2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email address`)
};

/**
* | output |
* | --- |
* | "Email address" |
*
* @param {Userprofile_Emailaddress2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_emailaddress2 = /** @type {((inputs?: Userprofile_Emailaddress2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Emailaddress2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_emailaddress2(inputs)
	if (locale === "es") return es_userprofile_emailaddress2(inputs)
	if (locale === "fr") return fr_userprofile_emailaddress2(inputs)
	return ar_userprofile_emailaddress2(inputs)
});
export { userprofile_emailaddress2 as "userProfile.emailAddress" }