/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Components_Appdidupgradedialog_Upgradecompletedesc6Inputs */

const en_developerportal_components_appdidupgradedialog_upgradecompletedesc6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradecompletedesc6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Your app "${i?.name}" now has its own unique identity for issuing credentials.`)
};

const es_developerportal_components_appdidupgradedialog_upgradecompletedesc6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradecompletedesc6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Tu aplicación "${i?.name}" ahora tiene su propia identidad única para emitir credenciales.`)
};

const fr_developerportal_components_appdidupgradedialog_upgradecompletedesc6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradecompletedesc6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Votre application "${i?.name}" a désormais sa propre identité unique pour émettre des credentials.`)
};

const ar_developerportal_components_appdidupgradedialog_upgradecompletedesc6 = /** @type {(inputs: Developerportal_Components_Appdidupgradedialog_Upgradecompletedesc6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تطبيقك "${i?.name}" لديه الآن هويته الفريدة لإصدار الشهادات الرقمية.`)
};

/**
* | output |
* | --- |
* | "Your app \"{name}\" now has its own unique identity for issuing credentials." |
*
* @param {Developerportal_Components_Appdidupgradedialog_Upgradecompletedesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdidupgradedialog_upgradecompletedesc6 = /** @type {((inputs: Developerportal_Components_Appdidupgradedialog_Upgradecompletedesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdidupgradedialog_Upgradecompletedesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdidupgradedialog_upgradecompletedesc6(inputs)
	if (locale === "es") return es_developerportal_components_appdidupgradedialog_upgradecompletedesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdidupgradedialog_upgradecompletedesc6(inputs)
	return ar_developerportal_components_appdidupgradedialog_upgradecompletedesc6(inputs)
});
export { developerportal_components_appdidupgradedialog_upgradecompletedesc6 as "developerPortal.components.appDidUpgradeDialog.upgradeCompleteDesc" }