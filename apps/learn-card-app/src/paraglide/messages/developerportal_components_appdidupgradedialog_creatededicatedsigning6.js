/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdidupgradedialog_Creatededicatedsigning6Inputs */

const en_developerportal_components_appdidupgradedialog_creatededicatedsigning6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Creatededicatedsigning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a dedicated signing authority`)
};

const es_developerportal_components_appdidupgradedialog_creatededicatedsigning6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Creatededicatedsigning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a dedicated signing authority`)
};

const fr_developerportal_components_appdidupgradedialog_creatededicatedsigning6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Creatededicatedsigning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a dedicated signing authority`)
};

const ar_developerportal_components_appdidupgradedialog_creatededicatedsigning6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Creatededicatedsigning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a dedicated signing authority`)
};

/**
* | output |
* | --- |
* | "Create a dedicated signing authority" |
*
* @param {Developerportal_Components_Appdidupgradedialog_Creatededicatedsigning6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_creatededicatedsigning6 = /** @type {((inputs?: Developerportal_Components_Appdidupgradedialog_Creatededicatedsigning6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Creatededicatedsigning6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_creatededicatedsigning6(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_creatededicatedsigning6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_creatededicatedsigning6(inputs)
	return ar_developerportal_components_appdidupgradedialog_creatededicatedsigning6(inputs)
});
export { developerportal_components_appdidupgradedialog_creatededicatedsigning6 as "developerPortal.components.appDidUpgradeDialog.createDedicatedSigning" }