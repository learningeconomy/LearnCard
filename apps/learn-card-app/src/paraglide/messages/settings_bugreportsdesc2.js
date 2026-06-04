/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Bugreportsdesc2Inputs */

const en_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatically send crash reports to help fix issues`)
};

const es_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envíe automáticamente informes de fallos para ayudar a solucionar problemas`)
};

const de_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Senden Sie automatisch Absturzberichte, um bei der Behebung von Problemen zu helfen`)
};

const ar_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال تقارير الأعطال تلقائيًا للمساعدة في حل المشكلات`)
};

const fr_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyez automatiquement des rapports d'erreur pour aider à résoudre les problèmes`)
};

const ko_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`문제 해결에 도움이 되는 충돌 보고서를 자동으로 보냅니다.`)
};

/**
* | output |
* | --- |
* | "Automatically send crash reports to help fix issues" |
*
* @param {Settings_Bugreportsdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_bugreportsdesc2 = /** @type {((inputs?: Settings_Bugreportsdesc2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Bugreportsdesc2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_bugreportsdesc2(inputs)
	if (locale === "es") return es_settings_bugreportsdesc2(inputs)
	if (locale === "de") return de_settings_bugreportsdesc2(inputs)
	if (locale === "ar") return ar_settings_bugreportsdesc2(inputs)
	if (locale === "fr") return fr_settings_bugreportsdesc2(inputs)
	return ko_settings_bugreportsdesc2(inputs)
});
export { settings_bugreportsdesc2 as "settings.bugReportsDesc" }