/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Profile_Menu_Buildmylearncard3Inputs */

const en_profile_menu_buildmylearncard3 = /** @type {(inputs: Profile_Menu_Buildmylearncard3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Build My ${i?.brand}`)
};

const es_profile_menu_buildmylearncard3 = /** @type {(inputs: Profile_Menu_Buildmylearncard3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Construye mi ${i?.brand}`)
};

const fr_profile_menu_buildmylearncard3 = /** @type {(inputs: Profile_Menu_Buildmylearncard3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Construire mon ${i?.brand}`)
};

const ar_profile_menu_buildmylearncard3 = /** @type {(inputs: Profile_Menu_Buildmylearncard3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ابنِ ${i?.brand} الخاص بي`)
};

/**
* | output |
* | --- |
* | "Build My {brand}" |
*
* @param {Profile_Menu_Buildmylearncard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_buildmylearncard3 = /** @type {((inputs: Profile_Menu_Buildmylearncard3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Buildmylearncard3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_buildmylearncard3(inputs)
	if (locale === "es") return es_profile_menu_buildmylearncard3(inputs)
	if (locale === "fr") return fr_profile_menu_buildmylearncard3(inputs)
	return ar_profile_menu_buildmylearncard3(inputs)
});
export { profile_menu_buildmylearncard3 as "profile.menu.buildMyLearnCard" }