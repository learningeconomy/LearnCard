/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Remindmelater6Inputs */

const en_developerportal_components_appdidupgradedialog_remindmelater6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Remindmelater6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remind Me Later`)
};

const es_developerportal_components_appdidupgradedialog_remindmelater6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Remindmelater6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recordármelo Después`)
};

const fr_developerportal_components_appdidupgradedialog_remindmelater6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Remindmelater6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Me Rappeler Plus Tard`)
};

const ar_developerportal_components_appdidupgradedialog_remindmelater6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Remindmelater6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ذكرني لاحقاً`)
};

/**
* | output |
* | --- |
* | "Remind Me Later" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Remindmelater6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_remindmelater6 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Remindmelater6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Remindmelater6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_remindmelater6(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_remindmelater6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_remindmelater6(inputs)
	return ar_developerportal_components_appdidupgradedialog_remindmelater6(inputs)
});
export { developerportal_components_appdidupgradedialog_remindmelater6 as "developerPortal.components.appDidUpgradeDialog.remindMeLater" }