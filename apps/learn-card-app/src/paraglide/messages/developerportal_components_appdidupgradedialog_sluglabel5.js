/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ slug: NonNullable<unknown> }} Developerportal_Components_Appdidupgradedialog_Sluglabel5Inputs */

const en_developerportal_components_appdidupgradedialog_sluglabel5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Sluglabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Slug: ${i?.slug}`)
};

const es_developerportal_components_appdidupgradedialog_sluglabel5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Sluglabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Slug: ${i?.slug}`)
};

const fr_developerportal_components_appdidupgradedialog_sluglabel5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Sluglabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Slug : ${i?.slug}`)
};

const ar_developerportal_components_appdidupgradedialog_sluglabel5 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Sluglabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Slug: ${i?.slug}`)
};

/**
* | output |
* | --- |
* | "Slug: {slug}" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Sluglabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_sluglabel5 = /** @type {((inputs: Developerportal_Components_Appdidupgradedialog_Sluglabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Sluglabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_sluglabel5(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_sluglabel5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_sluglabel5(inputs)
	return ar_developerportal_components_appdidupgradedialog_sluglabel5(inputs)
});
export { developerportal_components_appdidupgradedialog_sluglabel5 as "developerPortal.components.appDidUpgradeDialog.slugLabel" }