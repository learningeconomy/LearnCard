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

const de_settings_notifications_prompt_details = /** @type {(inputs: Settings_Notifications_Prompt_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue Verbindungsanfragen, neue Boosts (wie Erfolge, Anmeldeinformationen und Abzeichen).`)
};

const ar_settings_notifications_prompt_details = /** @type {(inputs: Settings_Notifications_Prompt_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات اتصال جديدة، وتعزيزات جديدة (مثل الإنجازات وبيانات الاعتماد والشارات).`)
};

const fr_settings_notifications_prompt_details = /** @type {(inputs: Settings_Notifications_Prompt_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelles demandes de connexion, nouveaux boosts (comme les réalisations, les informations d'identification et les badges).`)
};

const ko_settings_notifications_prompt_details = /** @type {(inputs: Settings_Notifications_Prompt_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새로운 연결 요청, 새로운 부스트(업적, 자격증명, 배지 등).`)
};

/**
* | output |
* | --- |
* | "New connection requests, New boosts (like achievements, credentials, and badges)." |
*
* @param {Settings_Notifications_Prompt_DetailsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_notifications_prompt_details = /** @type {((inputs?: Settings_Notifications_Prompt_DetailsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Prompt_DetailsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_prompt_details(inputs)
	if (locale === "es") return es_settings_notifications_prompt_details(inputs)
	if (locale === "de") return de_settings_notifications_prompt_details(inputs)
	if (locale === "ar") return ar_settings_notifications_prompt_details(inputs)
	if (locale === "fr") return fr_settings_notifications_prompt_details(inputs)
	return ko_settings_notifications_prompt_details(inputs)
});
export { settings_notifications_prompt_details as "settings.notifications.prompt.details" }