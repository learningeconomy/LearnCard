/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Menu_Admintools1Inputs */

const en_profile_menu_admintools1 = /** @type {(inputs: Profile_Menu_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Tools`)
};

const es_profile_menu_admintools1 = /** @type {(inputs: Profile_Menu_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas de administración`)
};

const fr_profile_menu_admintools1 = /** @type {(inputs: Profile_Menu_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils d'administration`)
};

const ar_profile_menu_admintools1 = /** @type {(inputs: Profile_Menu_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات المسؤول`)
};

/**
* | output |
* | --- |
* | "Admin Tools" |
*
* @param {Profile_Menu_Admintools1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_admintools1 = /** @type {((inputs?: Profile_Menu_Admintools1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Admintools1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_admintools1(inputs)
	if (locale === "es") return es_profile_menu_admintools1(inputs)
	if (locale === "fr") return fr_profile_menu_admintools1(inputs)
	return ar_profile_menu_admintools1(inputs)
});
export { profile_menu_admintools1 as "profile.menu.adminTools" }