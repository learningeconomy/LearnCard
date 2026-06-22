/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Prompt_TitleInputs */

const en_settings_notifications_prompt_title = /** @type {(inputs: Settings_Notifications_Prompt_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stay in the Loop?`)
};

const es_settings_notifications_prompt_title = /** @type {(inputs: Settings_Notifications_Prompt_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Permanecer informado?`)
};

const fr_settings_notifications_prompt_title = /** @type {(inputs: Settings_Notifications_Prompt_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rester au courant ?`)
};

const ar_settings_notifications_prompt_title = /** @type {(inputs: Settings_Notifications_Prompt_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البقاء في الحلقة؟`)
};

/**
* | output |
* | --- |
* | "Stay in the Loop?" |
*
* @param {Settings_Notifications_Prompt_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_title = /** @type {((inputs?: Settings_Notifications_Prompt_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_title(inputs)
	if (locale === "es") return es_settings_notifications_prompt_title(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_title(inputs)
	return ar_settings_notifications_prompt_title(inputs)
});
export { settings_notifications_prompt_title as "settings.notifications.prompt.title" }