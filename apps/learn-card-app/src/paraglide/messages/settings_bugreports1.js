/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Bugreports1Inputs */

const en_settings_bugreports1 = /** @type {(inputs: Settings_Bugreports1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crash Reports`)
};

const es_settings_bugreports1 = /** @type {(inputs: Settings_Bugreports1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Informes de fallos`)
};

const fr_settings_bugreports1 = /** @type {(inputs: Settings_Bugreports1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rapports de plantage`)
};

const ar_settings_bugreports1 = /** @type {(inputs: Settings_Bugreports1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقارير الأعطال`)
};

/**
* | output |
* | --- |
* | "Crash Reports" |
*
* @param {Settings_Bugreports1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_bugreports1 = /** @type {((inputs?: Settings_Bugreports1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Bugreports1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_bugreports1(inputs)
	if (locale === "es") return es_settings_bugreports1(inputs)
	if (locale === "fr") return fr_settings_bugreports1(inputs)
	return ar_settings_bugreports1(inputs)
});
export { settings_bugreports1 as "settings.bugReports" }