/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Aifeaturesdesc2Inputs */

const en_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI tutoring sessions, insights, and personalization`)
};

const es_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesiones de tutoría, conocimientos y personalización de IA`)
};

const de_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI-Nachhilfesitzungen, Einblicke und Personalisierung`)
};

const ar_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسات تعليم الذكاء الاصطناعي، والرؤى، والتخصيص`)
};

const fr_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Séances de tutorat en IA, informations et personnalisation`)
};

const ko_settings_aifeaturesdesc2 = /** @type {(inputs: Settings_Aifeaturesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI 튜터링 세션, 통찰력 및 개인화`)
};

/**
* | output |
* | --- |
* | "AI tutoring sessions, insights, and personalization" |
*
* @param {Settings_Aifeaturesdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_aifeaturesdesc2 = /** @type {((inputs?: Settings_Aifeaturesdesc2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Aifeaturesdesc2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_aifeaturesdesc2(inputs)
	if (locale === "es") return es_settings_aifeaturesdesc2(inputs)
	if (locale === "de") return de_settings_aifeaturesdesc2(inputs)
	if (locale === "ar") return ar_settings_aifeaturesdesc2(inputs)
	if (locale === "fr") return fr_settings_aifeaturesdesc2(inputs)
	return ko_settings_aifeaturesdesc2(inputs)
});
export { settings_aifeaturesdesc2 as "settings.aiFeaturesDesc" }