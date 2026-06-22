/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Prompt_ContinueInputs */

const en_settings_notifications_prompt_continue = /** @type {(inputs: Settings_Notifications_Prompt_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue`)
};

const es_settings_notifications_prompt_continue = /** @type {(inputs: Settings_Notifications_Prompt_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar`)
};

const fr_settings_notifications_prompt_continue = /** @type {(inputs: Settings_Notifications_Prompt_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer`)
};

const ar_settings_notifications_prompt_continue = /** @type {(inputs: Settings_Notifications_Prompt_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يكمل`)
};

/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Settings_Notifications_Prompt_ContinueInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_continue = /** @type {((inputs?: Settings_Notifications_Prompt_ContinueInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_ContinueInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_continue(inputs)
	if (locale === "es") return es_settings_notifications_prompt_continue(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_continue(inputs)
	return ar_settings_notifications_prompt_continue(inputs)
});
export { settings_notifications_prompt_continue as "settings.notifications.prompt.continue" }