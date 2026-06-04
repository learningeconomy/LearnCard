/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Notifications_Newboosts_Description1Inputs */

const en_settings_notifications_newboosts_description1 = /** @type {(inputs: Settings_Notifications_Newboosts_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts include all types of credentials including:  Skills, IDs, Achievements, Learning History, Work History, Currency, and Badges.`)
};

const es_settings_notifications_newboosts_description1 = /** @type {(inputs: Settings_Notifications_Newboosts_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los aumentos incluyen todo tipo de credenciales, incluidas: habilidades, identificaciones, logros, historial de aprendizaje, historial laboral, moneda e insignias.`)
};

const de_settings_notifications_newboosts_description1 = /** @type {(inputs: Settings_Notifications_Newboosts_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts umfassen alle Arten von Anmeldeinformationen, einschließlich: Fähigkeiten, Ausweise, Erfolge, Lernhistorie, Arbeitshistorie, Währung und Abzeichen.`)
};

const ar_settings_notifications_newboosts_description1 = /** @type {(inputs: Settings_Notifications_Newboosts_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشمل التعزيزات جميع أنواع بيانات الاعتماد بما في ذلك: المهارات والمعرفات والإنجازات وتاريخ التعلم وسجل العمل والعملة والشارات.`)
};

const fr_settings_notifications_newboosts_description1 = /** @type {(inputs: Settings_Notifications_Newboosts_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les boosts incluent tous les types d'informations d'identification, notamment : les compétences, les identifiants, les réalisations, l'historique d'apprentissage, l'historique de travail, la devise et les badges.`)
};

const ko_settings_notifications_newboosts_description1 = /** @type {(inputs: Settings_Notifications_Newboosts_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트에는 기술, ID, 업적, 학습 기록, 작업 기록, 통화 및 배지를 포함한 모든 유형의 자격 증명이 포함됩니다.`)
};

/**
* | output |
* | --- |
* | "Boosts include all types of credentials including: Skills, IDs, Achievements, Learning History, Work History, Currency, and Badges." |
*
* @param {Settings_Notifications_Newboosts_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_notifications_newboosts_description1 = /** @type {((inputs?: Settings_Notifications_Newboosts_Description1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Newboosts_Description1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_newboosts_description1(inputs)
	if (locale === "es") return es_settings_notifications_newboosts_description1(inputs)
	if (locale === "de") return de_settings_notifications_newboosts_description1(inputs)
	if (locale === "ar") return ar_settings_notifications_newboosts_description1(inputs)
	if (locale === "fr") return fr_settings_notifications_newboosts_description1(inputs)
	return ko_settings_notifications_newboosts_description1(inputs)
});
export { settings_notifications_newboosts_description1 as "settings.notifications.newBoosts.description" }