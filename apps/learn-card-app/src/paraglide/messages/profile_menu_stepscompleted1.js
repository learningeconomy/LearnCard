/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ completed: NonNullable<unknown>, total: NonNullable<unknown> }} Profile_Menu_Stepscompleted1Inputs */

const en_profile_menu_stepscompleted1 = /** @type {(inputs: Profile_Menu_Stepscompleted1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} of ${i?.total}`)
};

const es_profile_menu_stepscompleted1 = /** @type {(inputs: Profile_Menu_Stepscompleted1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} de ${i?.total}`)
};

const fr_profile_menu_stepscompleted1 = /** @type {(inputs: Profile_Menu_Stepscompleted1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} sur ${i?.total}`)
};

const ar_profile_menu_stepscompleted1 = /** @type {(inputs: Profile_Menu_Stepscompleted1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.completed} من ${i?.total}`)
};

/**
* | output |
* | --- |
* | "{completed} of {total}" |
*
* @param {Profile_Menu_Stepscompleted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_stepscompleted1 = /** @type {((inputs: Profile_Menu_Stepscompleted1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Stepscompleted1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_stepscompleted1(inputs)
	if (locale === "es") return es_profile_menu_stepscompleted1(inputs)
	if (locale === "fr") return fr_profile_menu_stepscompleted1(inputs)
	return ar_profile_menu_stepscompleted1(inputs)
});
export { profile_menu_stepscompleted1 as "profile.menu.stepsCompleted" }