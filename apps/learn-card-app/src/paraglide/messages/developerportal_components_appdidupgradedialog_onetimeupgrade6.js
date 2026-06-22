/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Onetimeupgrade6Inputs */

const en_developerportal_components_appdidupgradedialog_onetimeupgrade6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Onetimeupgrade6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is a one-time upgrade and your app will continue working normally.`)
};

const es_developerportal_components_appdidupgradedialog_onetimeupgrade6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Onetimeupgrade6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is a one-time upgrade and your app will continue working normally.`)
};

const fr_developerportal_components_appdidupgradedialog_onetimeupgrade6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Onetimeupgrade6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is a one-time upgrade and your app will continue working normally.`)
};

const ar_developerportal_components_appdidupgradedialog_onetimeupgrade6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Onetimeupgrade6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is a one-time upgrade and your app will continue working normally.`)
};

/**
* | output |
* | --- |
* | "This is a one-time upgrade and your app will continue working normally." |
*
* @param {Developerportal_Components_Appdidupgradedialog_Onetimeupgrade6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_onetimeupgrade6 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Onetimeupgrade6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Onetimeupgrade6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_onetimeupgrade6(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_onetimeupgrade6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_onetimeupgrade6(inputs)
	return ar_developerportal_components_appdidupgradedialog_onetimeupgrade6(inputs)
});
export { developerportal_components_appdidupgradedialog_onetimeupgrade6 as "developerPortal.components.appDidUpgradeDialog.oneTimeUpgrade" }