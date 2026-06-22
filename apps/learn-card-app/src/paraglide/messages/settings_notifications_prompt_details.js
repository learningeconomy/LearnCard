/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Prompt_DetailsInputs */

const en_settings_notifications_prompt_details = /** @type {(inputs: Settings_Notifications_Prompt_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New connection requests, New boosts (like achievements, credentials, and badges).`)
};

const es_settings_notifications_prompt_details = /** @type {(inputs: Settings_Notifications_Prompt_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevas solicitudes de conexión, nuevos impulsos (como logros, credenciales e insignias).`)
};

const fr_settings_notifications_prompt_details = /** @type {(inputs: Settings_Notifications_Prompt_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelles demandes de connexion, nouveaux boosts (comme les réalisations, les informations d'identification et les badges).`)
};

const ar_settings_notifications_prompt_details = /** @type {(inputs: Settings_Notifications_Prompt_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات اتصال جديدة، وتعزيزات جديدة (مثل الإنجازات وبيانات الاعتماد والشارات).`)
};

/**
* | output |
* | --- |
* | "New connection requests, New boosts (like achievements, credentials, and badges)." |
*
* @param {Settings_Notifications_Prompt_DetailsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_details = /** @type {((inputs?: Settings_Notifications_Prompt_DetailsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_DetailsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_details(inputs)
	if (locale === "es") return es_settings_notifications_prompt_details(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_details(inputs)
	return ar_settings_notifications_prompt_details(inputs)
});
export { settings_notifications_prompt_details as "settings.notifications.prompt.details" }