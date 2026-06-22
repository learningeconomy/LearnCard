/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Prompt_Privacypolicy1Inputs */

const en_settings_notifications_prompt_privacypolicy1 = /** @type {(inputs: Settings_Notifications_Prompt_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_settings_notifications_prompt_privacypolicy1 = /** @type {(inputs: Settings_Notifications_Prompt_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`política de privacidad`)
};

const fr_settings_notifications_prompt_privacypolicy1 = /** @type {(inputs: Settings_Notifications_Prompt_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`politique de confidentialité`)
};

const ar_settings_notifications_prompt_privacypolicy1 = /** @type {(inputs: Settings_Notifications_Prompt_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة الخصوصية`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Settings_Notifications_Prompt_Privacypolicy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_privacypolicy1 = /** @type {((inputs?: Settings_Notifications_Prompt_Privacypolicy1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_Privacypolicy1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_privacypolicy1(inputs)
	if (locale === "es") return es_settings_notifications_prompt_privacypolicy1(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_privacypolicy1(inputs)
	return ar_settings_notifications_prompt_privacypolicy1(inputs)
});
export { settings_notifications_prompt_privacypolicy1 as "settings.notifications.prompt.privacyPolicy" }