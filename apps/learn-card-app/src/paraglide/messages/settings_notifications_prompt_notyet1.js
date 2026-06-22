/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Prompt_Notyet1Inputs */

const en_settings_notifications_prompt_notyet1 = /** @type {(inputs: Settings_Notifications_Prompt_Notyet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not Yet`)
};

const es_settings_notifications_prompt_notyet1 = /** @type {(inputs: Settings_Notifications_Prompt_Notyet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no`)
};

const fr_settings_notifications_prompt_notyet1 = /** @type {(inputs: Settings_Notifications_Prompt_Notyet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore`)
};

const ar_settings_notifications_prompt_notyet1 = /** @type {(inputs: Settings_Notifications_Prompt_Notyet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ليس بعد`)
};

/**
* | output |
* | --- |
* | "Not Yet" |
*
* @param {Settings_Notifications_Prompt_Notyet1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_notyet1 = /** @type {((inputs?: Settings_Notifications_Prompt_Notyet1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_Notyet1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_notyet1(inputs)
	if (locale === "es") return es_settings_notifications_prompt_notyet1(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_notyet1(inputs)
	return ar_settings_notifications_prompt_notyet1(inputs)
});
export { settings_notifications_prompt_notyet1 as "settings.notifications.prompt.notYet" }