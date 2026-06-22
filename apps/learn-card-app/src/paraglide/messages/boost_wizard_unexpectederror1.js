/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Unexpectederror1Inputs */

const en_boost_wizard_unexpectederror1 = /** @type {(inputs: Boost_Wizard_Unexpectederror1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An unexpected error occurred. Please try again.`)
};

const es_boost_wizard_unexpectederror1 = /** @type {(inputs: Boost_Wizard_Unexpectederror1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error inesperado. Inténtalo de nuevo.`)
};

const fr_boost_wizard_unexpectederror1 = /** @type {(inputs: Boost_Wizard_Unexpectederror1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur inattendue s'est produite. Veuillez réessayer.`)
};

const ar_boost_wizard_unexpectederror1 = /** @type {(inputs: Boost_Wizard_Unexpectederror1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ غير متوقع. يُرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "An unexpected error occurred. Please try again." |
*
* @param {Boost_Wizard_Unexpectederror1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_unexpectederror1 = /** @type {((inputs?: Boost_Wizard_Unexpectederror1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Unexpectederror1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_unexpectederror1(inputs)
	if (locale === "es") return es_boost_wizard_unexpectederror1(inputs)
	if (locale === "fr") return fr_boost_wizard_unexpectederror1(inputs)
	return ar_boost_wizard_unexpectederror1(inputs)
});
export { boost_wizard_unexpectederror1 as "boost.wizard.unexpectedError" }