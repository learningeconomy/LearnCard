/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notifications_Editsettings1Inputs */

const en_notifications_editsettings1 = /** @type {(inputs: Notifications_Editsettings1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Notification Settings`)
};

const es_notifications_editsettings1 = /** @type {(inputs: Notifications_Editsettings1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Configuración de Notificaciones`)
};

const fr_notifications_editsettings1 = /** @type {(inputs: Notifications_Editsettings1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier les paramètres de notification`)
};

const ar_notifications_editsettings1 = /** @type {(inputs: Notifications_Editsettings1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Notification Settings`)
};

/**
* | output |
* | --- |
* | "Edit Notification Settings" |
*
* @param {Notifications_Editsettings1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const notifications_editsettings1 = /** @type {((inputs?: Notifications_Editsettings1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Editsettings1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_notifications_editsettings1(inputs)
	if (locale === "es") return es_notifications_editsettings1(inputs)
	if (locale === "fr") return fr_notifications_editsettings1(inputs)
	return ar_notifications_editsettings1(inputs)
});
export { notifications_editsettings1 as "notifications.editSettings" }