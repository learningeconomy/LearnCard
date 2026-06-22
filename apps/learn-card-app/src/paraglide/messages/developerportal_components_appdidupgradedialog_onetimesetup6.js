/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Onetimesetup6Inputs */

const en_developerportal_components_appdidupgradedialog_onetimesetup6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Onetimesetup6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`One-time setup required`)
};

const es_developerportal_components_appdidupgradedialog_onetimesetup6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Onetimesetup6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración única requerida`)
};

const fr_developerportal_components_appdidupgradedialog_onetimesetup6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Onetimesetup6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration unique requise`)
};

const ar_developerportal_components_appdidupgradedialog_onetimesetup6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Onetimesetup6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد لمرة واحدة مطلوب`)
};

/**
* | output |
* | --- |
* | "One-time setup required" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Onetimesetup6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_onetimesetup6 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Onetimesetup6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Onetimesetup6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_onetimesetup6(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_onetimesetup6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_onetimesetup6(inputs)
	return ar_developerportal_components_appdidupgradedialog_onetimesetup6(inputs)
});
export { developerportal_components_appdidupgradedialog_onetimesetup6 as "developerPortal.components.appDidUpgradeDialog.oneTimeSetup" }