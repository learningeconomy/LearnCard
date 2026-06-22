/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_71Inputs */

const en_boost_wizard_loadertext_71 = /** @type {(inputs: Boost_Wizard_Loadertext_71Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finalizing everything now...`)
};

const es_boost_wizard_loadertext_71 = /** @type {(inputs: Boost_Wizard_Loadertext_71Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finalizando todo ahora...`)
};

const fr_boost_wizard_loadertext_71 = /** @type {(inputs: Boost_Wizard_Loadertext_71Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finalisation en cours...`)
};

const ar_boost_wizard_loadertext_71 = /** @type {(inputs: Boost_Wizard_Loadertext_71Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إنهاء كل شيء الآن...`)
};

/**
* | output |
* | --- |
* | "Finalizing everything now..." |
*
* @param {Boost_Wizard_Loadertext_71Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_71 = /** @type {((inputs?: Boost_Wizard_Loadertext_71Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_71Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_71(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_71(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_71(inputs)
	return ar_boost_wizard_loadertext_71(inputs)
});
export { boost_wizard_loadertext_71 as "boost.wizard.loaderText.7" }