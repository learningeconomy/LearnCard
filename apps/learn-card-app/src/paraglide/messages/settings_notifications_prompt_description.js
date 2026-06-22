/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Prompt_DescriptionInputs */

const en_settings_notifications_prompt_description = /** @type {(inputs: Settings_Notifications_Prompt_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Receive push notifications for:`)
};

const es_settings_notifications_prompt_description = /** @type {(inputs: Settings_Notifications_Prompt_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reciba notificaciones automáticas para:`)
};

const fr_settings_notifications_prompt_description = /** @type {(inputs: Settings_Notifications_Prompt_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recevez des notifications push pour :`)
};

const ar_settings_notifications_prompt_description = /** @type {(inputs: Settings_Notifications_Prompt_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تلقي إشعارات الدفع لـ:`)
};

/**
* | output |
* | --- |
* | "Receive push notifications for:" |
*
* @param {Settings_Notifications_Prompt_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_description = /** @type {((inputs?: Settings_Notifications_Prompt_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_description(inputs)
	if (locale === "es") return es_settings_notifications_prompt_description(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_description(inputs)
	return ar_settings_notifications_prompt_description(inputs)
});
export { settings_notifications_prompt_description as "settings.notifications.prompt.description" }