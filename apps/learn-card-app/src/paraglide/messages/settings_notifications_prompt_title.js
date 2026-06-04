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

const de_settings_notifications_prompt_title = /** @type {(inputs: Settings_Notifications_Prompt_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auf dem Laufenden bleiben?`)
};

const ar_settings_notifications_prompt_title = /** @type {(inputs: Settings_Notifications_Prompt_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البقاء في الحلقة؟`)
};

const fr_settings_notifications_prompt_title = /** @type {(inputs: Settings_Notifications_Prompt_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rester au courant ?`)
};

const ko_settings_notifications_prompt_title = /** @type {(inputs: Settings_Notifications_Prompt_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`최신 소식을 확인하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Stay in the Loop?" |
*
* @param {Settings_Notifications_Prompt_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_title = /** @type {((inputs?: Settings_Notifications_Prompt_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_title(inputs)
	if (locale === "es") return es_settings_notifications_prompt_title(inputs)
	if (locale === "de") return de_settings_notifications_prompt_title(inputs)
	if (locale === "ar") return ar_settings_notifications_prompt_title(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_title(inputs)
	return ko_settings_notifications_prompt_title(inputs)
});
export { settings_notifications_prompt_title as "settings.notifications.prompt.title" }