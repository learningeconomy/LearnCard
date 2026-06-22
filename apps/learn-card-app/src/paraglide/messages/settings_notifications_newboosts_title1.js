/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Newboosts_Title1Inputs */

const en_settings_notifications_newboosts_title1 = /** @type {(inputs: Settings_Notifications_Newboosts_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Boosts`)
};

const es_settings_notifications_newboosts_title1 = /** @type {(inputs: Settings_Notifications_Newboosts_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevos aumentos`)
};

const fr_settings_notifications_newboosts_title1 = /** @type {(inputs: Settings_Notifications_Newboosts_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveaux boosts`)
};

const ar_settings_notifications_newboosts_title1 = /** @type {(inputs: Settings_Notifications_Newboosts_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعزيزات جديدة`)
};

/**
* | output |
* | --- |
* | "New Boosts" |
*
* @param {Settings_Notifications_Newboosts_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_newboosts_title1 = /** @type {((inputs?: Settings_Notifications_Newboosts_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Newboosts_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_newboosts_title1(inputs)
	if (locale === "es") return es_settings_notifications_newboosts_title1(inputs)
	if (locale === "fr") return fr_settings_notifications_newboosts_title1(inputs)
	return ar_settings_notifications_newboosts_title1(inputs)
});
export { settings_notifications_newboosts_title1 as "settings.notifications.newBoosts.title" }