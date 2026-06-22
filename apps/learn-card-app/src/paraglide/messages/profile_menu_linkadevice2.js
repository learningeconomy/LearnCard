/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Menu_Linkadevice2Inputs */

const en_profile_menu_linkadevice2 = /** @type {(inputs: Profile_Menu_Linkadevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link a Device`)
};

const es_profile_menu_linkadevice2 = /** @type {(inputs: Profile_Menu_Linkadevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vincular un dispositivo`)
};

const fr_profile_menu_linkadevice2 = /** @type {(inputs: Profile_Menu_Linkadevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Associer un appareil`)
};

const ar_profile_menu_linkadevice2 = /** @type {(inputs: Profile_Menu_Linkadevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربط جهاز`)
};

/**
* | output |
* | --- |
* | "Link a Device" |
*
* @param {Profile_Menu_Linkadevice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_linkadevice2 = /** @type {((inputs?: Profile_Menu_Linkadevice2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Linkadevice2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_linkadevice2(inputs)
	if (locale === "es") return es_profile_menu_linkadevice2(inputs)
	if (locale === "fr") return fr_profile_menu_linkadevice2(inputs)
	return ar_profile_menu_linkadevice2(inputs)
});
export { profile_menu_linkadevice2 as "profile.menu.linkADevice" }