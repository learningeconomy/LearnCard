/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Bugreportsdesc2Inputs */

const en_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share technical details if the app crashes so we can fix issues faster`)
};

const es_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte detalles técnicos si la app falla para que podamos solucionar problemas más rápido`)
};

const fr_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez les détails techniques en cas de plantage de l'app pour que nous puissions corriger les problèmes plus vite`)
};

const ar_settings_bugreportsdesc2 = /** @type {(inputs: Settings_Bugreportsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارك التفاصيل التقنية عند تعطّل التطبيق حتى نتمكن من إصلاح المشكلات بشكل أسرع`)
};

/**
* | output |
* | --- |
* | "Share technical details if the app crashes so we can fix issues faster" |
*
* @param {Settings_Bugreportsdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_bugreportsdesc2 = /** @type {((inputs?: Settings_Bugreportsdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Bugreportsdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_bugreportsdesc2(inputs)
	if (locale === "es") return es_settings_bugreportsdesc2(inputs)
	if (locale === "fr") return fr_settings_bugreportsdesc2(inputs)
	return ar_settings_bugreportsdesc2(inputs)
});
export { settings_bugreportsdesc2 as "settings.bugReportsDesc" }