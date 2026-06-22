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

const fr_settings_notifications_newboosts_description1 = /** @type {(inputs: Settings_Notifications_Newboosts_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les boosts incluent tous les types d'informations d'identification, notamment : les compétences, les identifiants, les réalisations, l'historique d'apprentissage, l'historique de travail, la devise et les badges.`)
};

const ar_settings_notifications_newboosts_description1 = /** @type {(inputs: Settings_Notifications_Newboosts_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشمل التعزيزات جميع أنواع بيانات الاعتماد بما في ذلك: المهارات والمعرفات والإنجازات وتاريخ التعلم وسجل العمل والعملة والشارات.`)
};

/**
* | output |
* | --- |
* | "Boosts include all types of credentials including: Skills, IDs, Achievements, Learning History, Work History, Currency, and Badges." |
*
* @param {Settings_Notifications_Newboosts_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_notifications_newboosts_description1 = /** @type {((inputs?: Settings_Notifications_Newboosts_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Notifications_Newboosts_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_notifications_newboosts_description1(inputs)
	if (locale === "es") return es_settings_notifications_newboosts_description1(inputs)
	if (locale === "fr") return fr_settings_notifications_newboosts_description1(inputs)
	return ar_settings_notifications_newboosts_description1(inputs)
});
export { settings_notifications_newboosts_description1 as "settings.notifications.newBoosts.description" }