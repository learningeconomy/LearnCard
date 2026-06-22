/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Menu_Emailaddresses1Inputs */

const en_profile_menu_emailaddresses1 = /** @type {(inputs: Profile_Menu_Emailaddresses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Addresses`)
};

const es_profile_menu_emailaddresses1 = /** @type {(inputs: Profile_Menu_Emailaddresses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Direcciones de correo`)
};

const fr_profile_menu_emailaddresses1 = /** @type {(inputs: Profile_Menu_Emailaddresses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adresses e-mail`)
};

const ar_profile_menu_emailaddresses1 = /** @type {(inputs: Profile_Menu_Emailaddresses1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عناوين البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email Addresses" |
*
* @param {Profile_Menu_Emailaddresses1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_emailaddresses1 = /** @type {((inputs?: Profile_Menu_Emailaddresses1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Emailaddresses1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_emailaddresses1(inputs)
	if (locale === "es") return es_profile_menu_emailaddresses1(inputs)
	if (locale === "fr") return fr_profile_menu_emailaddresses1(inputs)
	return ar_profile_menu_emailaddresses1(inputs)
});
export { profile_menu_emailaddresses1 as "profile.menu.emailAddresses" }