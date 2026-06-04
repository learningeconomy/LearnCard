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

const de_settings_notifications_prompt_continue = /** @type {(inputs: Settings_Notifications_Prompt_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Weitermachen`)
};

const ar_settings_notifications_prompt_continue = /** @type {(inputs: Settings_Notifications_Prompt_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يكمل`)
};

const fr_settings_notifications_prompt_continue = /** @type {(inputs: Settings_Notifications_Prompt_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer`)
};

const ko_settings_notifications_prompt_continue = /** @type {(inputs: Settings_Notifications_Prompt_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계속하다`)
};

/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Settings_Notifications_Prompt_ContinueInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_continue = /** @type {((inputs?: Settings_Notifications_Prompt_ContinueInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_ContinueInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_continue(inputs)
	if (locale === "es") return es_settings_notifications_prompt_continue(inputs)
	if (locale === "de") return de_settings_notifications_prompt_continue(inputs)
	if (locale === "ar") return ar_settings_notifications_prompt_continue(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_continue(inputs)
	return ko_settings_notifications_prompt_continue(inputs)
});
export { settings_notifications_prompt_continue as "settings.notifications.prompt.continue" }