/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_TitleInputs */

const en_settings_notifications_title = /** @type {(inputs: Settings_Notifications_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Notification Settings`)
};

const es_settings_notifications_title = /** @type {(inputs: Settings_Notifications_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar configuración de notificaciones`)
};

const fr_settings_notifications_title = /** @type {(inputs: Settings_Notifications_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier les paramètres de notification`)
};

const ar_settings_notifications_title = /** @type {(inputs: Settings_Notifications_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحرير إعدادات الإخطار`)
};

/**
* | output |
* | --- |
* | "Edit Notification Settings" |
*
* @param {Settings_Notifications_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_title = /** @type {((inputs?: Settings_Notifications_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_title(inputs)
	if (locale === "es") return es_settings_notifications_title(inputs)
	if (locale === "fr") return fr_settings_notifications_title(inputs)
	return ar_settings_notifications_title(inputs)
});
export { settings_notifications_title as "settings.notifications.title" }