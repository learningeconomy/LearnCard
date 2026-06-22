/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Loadertext_41Inputs */

const en_boost_wizard_loadertext_41 = /** @type {(inputs: Boost_Wizard_Loadertext_41Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Building your verifiable record...`)
};

const es_boost_wizard_loadertext_41 = /** @type {(inputs: Boost_Wizard_Loadertext_41Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando tu registro verificable...`)
};

const fr_boost_wizard_loadertext_41 = /** @type {(inputs: Boost_Wizard_Loadertext_41Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création de votre enregistrement vérifiable...`)
};

const ar_boost_wizard_loadertext_41 = /** @type {(inputs: Boost_Wizard_Loadertext_41Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ بناء سجلك القابل للتحقق...`)
};

/**
* | output |
* | --- |
* | "Building your verifiable record..." |
*
* @param {Boost_Wizard_Loadertext_41Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_loadertext_41 = /** @type {((inputs?: Boost_Wizard_Loadertext_41Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Loadertext_41Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_loadertext_41(inputs)
	if (locale === "es") return es_boost_wizard_loadertext_41(inputs)
	if (locale === "fr") return fr_boost_wizard_loadertext_41(inputs)
	return ar_boost_wizard_loadertext_41(inputs)
});
export { boost_wizard_loadertext_41 as "boost.wizard.loaderText.4" }