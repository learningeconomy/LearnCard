/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Settings_Analyticsdesc1Inputs */

const en_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Help improve ${i?.brand} by sharing anonymous app usage data`)
};

const es_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ayuda a mejorar ${i?.brand} compartiendo datos de uso anónimos`)
};

const fr_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aidez à améliorer ${i?.brand} en partageant des données d'utilisation anonymes`)
};

const ar_settings_analyticsdesc1 = /** @type {(inputs: Settings_Analyticsdesc1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ساعد في تحسين ${i?.brand} من خلال مشاركة بيانات استخدام مجهولة المصدر`)
};

/**
* | output |
* | --- |
* | "Help improve {brand} by sharing anonymous app usage data" |
*
* @param {Settings_Analyticsdesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_analyticsdesc1 = /** @type {((inputs: Settings_Analyticsdesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Analyticsdesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_analyticsdesc1(inputs)
	if (locale === "es") return es_settings_analyticsdesc1(inputs)
	if (locale === "fr") return fr_settings_analyticsdesc1(inputs)
	return ar_settings_analyticsdesc1(inputs)
});
export { settings_analyticsdesc1 as "settings.analyticsDesc" }