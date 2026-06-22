/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Noslugassigned6Inputs */

const en_developerportal_components_appdidupgradedialog_noslugassigned6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Noslugassigned6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No slug assigned`)
};

const es_developerportal_components_appdidupgradedialog_noslugassigned6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Noslugassigned6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin slug asignado`)
};

const fr_developerportal_components_appdidupgradedialog_noslugassigned6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Noslugassigned6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun slug attribué`)
};

const ar_developerportal_components_appdidupgradedialog_noslugassigned6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Noslugassigned6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تعيين slug`)
};

/**
* | output |
* | --- |
* | "No slug assigned" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Noslugassigned6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_noslugassigned6 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Noslugassigned6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Noslugassigned6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_noslugassigned6(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_noslugassigned6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_noslugassigned6(inputs)
	return ar_developerportal_components_appdidupgradedialog_noslugassigned6(inputs)
});
export { developerportal_components_appdidupgradedialog_noslugassigned6 as "developerPortal.components.appDidUpgradeDialog.noSlugAssigned" }