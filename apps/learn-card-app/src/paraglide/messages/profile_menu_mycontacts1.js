/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Menu_Mycontacts1Inputs */

const en_profile_menu_mycontacts1 = /** @type {(inputs: Profile_Menu_Mycontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Contacts`)
};

const es_profile_menu_mycontacts1 = /** @type {(inputs: Profile_Menu_Mycontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mis contactos`)
};

const fr_profile_menu_mycontacts1 = /** @type {(inputs: Profile_Menu_Mycontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mes contacts`)
};

const ar_profile_menu_mycontacts1 = /** @type {(inputs: Profile_Menu_Mycontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات اتصالي`)
};

/**
* | output |
* | --- |
* | "My Contacts" |
*
* @param {Profile_Menu_Mycontacts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_mycontacts1 = /** @type {((inputs?: Profile_Menu_Mycontacts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Mycontacts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_mycontacts1(inputs)
	if (locale === "es") return es_profile_menu_mycontacts1(inputs)
	if (locale === "fr") return fr_profile_menu_mycontacts1(inputs)
	return ar_profile_menu_mycontacts1(inputs)
});
export { profile_menu_mycontacts1 as "profile.menu.myContacts" }