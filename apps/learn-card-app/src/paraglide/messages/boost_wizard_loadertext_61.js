/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_61Inputs */

const en_boost_wizard_loadertext_61 = /** @type {(inputs: Boost_Wizard_Loadertext_61Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating your digital badge...`)
};

const es_boost_wizard_loadertext_61 = /** @type {(inputs: Boost_Wizard_Loadertext_61Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando tu insignia digital...`)
};

const fr_boost_wizard_loadertext_61 = /** @type {(inputs: Boost_Wizard_Loadertext_61Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création de votre badge numérique...`)
};

const ar_boost_wizard_loadertext_61 = /** @type {(inputs: Boost_Wizard_Loadertext_61Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إنشاء شارتك الرقمية...`)
};

/**
* | output |
* | --- |
* | "Creating your digital badge..." |
*
* @param {Boost_Wizard_Loadertext_61Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_61 = /** @type {((inputs?: Boost_Wizard_Loadertext_61Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_61Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_61(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_61(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_61(inputs)
	return ar_boost_wizard_loadertext_61(inputs)
});
export { boost_wizard_loadertext_61 as "boost.wizard.loaderText.6" }