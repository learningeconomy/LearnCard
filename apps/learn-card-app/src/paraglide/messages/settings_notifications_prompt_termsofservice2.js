/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Prompt_Termsofservice2Inputs */

const en_settings_notifications_prompt_termsofservice2 = /** @type {(inputs: Settings_Notifications_Prompt_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

const es_settings_notifications_prompt_termsofservice2 = /** @type {(inputs: Settings_Notifications_Prompt_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos de servicio`)
};

const de_settings_notifications_prompt_termsofservice2 = /** @type {(inputs: Settings_Notifications_Prompt_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nutzungsbedingungen`)
};

const ar_settings_notifications_prompt_termsofservice2 = /** @type {(inputs: Settings_Notifications_Prompt_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شروط الخدمة`)
};

const fr_settings_notifications_prompt_termsofservice2 = /** @type {(inputs: Settings_Notifications_Prompt_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions d'utilisation`)
};

const ko_settings_notifications_prompt_termsofservice2 = /** @type {(inputs: Settings_Notifications_Prompt_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`서비스 약관`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Settings_Notifications_Prompt_Termsofservice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_termsofservice2 = /** @type {((inputs?: Settings_Notifications_Prompt_Termsofservice2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_Termsofservice2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_termsofservice2(inputs)
	if (locale === "es") return es_settings_notifications_prompt_termsofservice2(inputs)
	if (locale === "de") return de_settings_notifications_prompt_termsofservice2(inputs)
	if (locale === "ar") return ar_settings_notifications_prompt_termsofservice2(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_termsofservice2(inputs)
	return ko_settings_notifications_prompt_termsofservice2(inputs)
});
export { settings_notifications_prompt_termsofservice2 as "settings.notifications.prompt.termsOfService" }