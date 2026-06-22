/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Menu_Managedatasharing2Inputs */

const en_profile_menu_managedatasharing2 = /** @type {(inputs: Profile_Menu_Managedatasharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Data Sharing`)
};

const es_profile_menu_managedatasharing2 = /** @type {(inputs: Profile_Menu_Managedatasharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar uso compartido de datos`)
};

const fr_profile_menu_managedatasharing2 = /** @type {(inputs: Profile_Menu_Managedatasharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer le partage des données`)
};

const ar_profile_menu_managedatasharing2 = /** @type {(inputs: Profile_Menu_Managedatasharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة مشاركة البيانات`)
};

/**
* | output |
* | --- |
* | "Manage Data Sharing" |
*
* @param {Profile_Menu_Managedatasharing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_menu_managedatasharing2 = /** @type {((inputs?: Profile_Menu_Managedatasharing2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Menu_Managedatasharing2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_menu_managedatasharing2(inputs)
	if (locale === "es") return es_profile_menu_managedatasharing2(inputs)
	if (locale === "fr") return fr_profile_menu_managedatasharing2(inputs)
	return ar_profile_menu_managedatasharing2(inputs)
});
export { profile_menu_managedatasharing2 as "profile.menu.manageDataSharing" }