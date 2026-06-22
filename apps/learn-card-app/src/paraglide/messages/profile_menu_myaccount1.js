/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Menu_Myaccount1Inputs */

const en_profile_menu_myaccount1 = /** @type {(inputs: Profile_Menu_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Account`)
};

const es_profile_menu_myaccount1 = /** @type {(inputs: Profile_Menu_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi cuenta`)
};

const fr_profile_menu_myaccount1 = /** @type {(inputs: Profile_Menu_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon compte`)
};

const ar_profile_menu_myaccount1 = /** @type {(inputs: Profile_Menu_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسابي`)
};

/**
* | output |
* | --- |
* | "My Account" |
*
* @param {Profile_Menu_Myaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_myaccount1 = /** @type {((inputs?: Profile_Menu_Myaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Myaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_myaccount1(inputs)
	if (locale === "es") return es_profile_menu_myaccount1(inputs)
	if (locale === "fr") return fr_profile_menu_myaccount1(inputs)
	return ar_profile_menu_myaccount1(inputs)
});
export { profile_menu_myaccount1 as "profile.menu.myAccount" }