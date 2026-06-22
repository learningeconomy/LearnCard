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

const fr_settings_notifications_prompt_termsofservice2 = /** @type {(inputs: Settings_Notifications_Prompt_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions d'utilisation`)
};

const ar_settings_notifications_prompt_termsofservice2 = /** @type {(inputs: Settings_Notifications_Prompt_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شروط الخدمة`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Settings_Notifications_Prompt_Termsofservice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_termsofservice2 = /** @type {((inputs?: Settings_Notifications_Prompt_Termsofservice2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_Termsofservice2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_termsofservice2(inputs)
	if (locale === "es") return es_settings_notifications_prompt_termsofservice2(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_termsofservice2(inputs)
	return ar_settings_notifications_prompt_termsofservice2(inputs)
});
export { settings_notifications_prompt_termsofservice2 as "settings.notifications.prompt.termsOfService" }