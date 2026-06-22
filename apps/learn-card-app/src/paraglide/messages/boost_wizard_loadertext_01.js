/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_01Inputs */

const en_boost_wizard_loadertext_01 = /** @type {(inputs: Boost_Wizard_Loadertext_01Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyzing your inputs...`)
};

const es_boost_wizard_loadertext_01 = /** @type {(inputs: Boost_Wizard_Loadertext_01Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analizando tus datos...`)
};

const fr_boost_wizard_loadertext_01 = /** @type {(inputs: Boost_Wizard_Loadertext_01Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyse de vos données...`)
};

const ar_boost_wizard_loadertext_01 = /** @type {(inputs: Boost_Wizard_Loadertext_01Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحليل مدخلاتك...`)
};

/**
* | output |
* | --- |
* | "Analyzing your inputs..." |
*
* @param {Boost_Wizard_Loadertext_01Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_01 = /** @type {((inputs?: Boost_Wizard_Loadertext_01Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_01Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_01(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_01(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_01(inputs)
	return ar_boost_wizard_loadertext_01(inputs)
});
export { boost_wizard_loadertext_01 as "boost.wizard.loaderText.0" }