/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Advancedsettings3Inputs */

const en_developerportal_components_accountselector_advancedsettings3 = /** @type {(inputs: Developerportal_Components_Accountselector_Advancedsettings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced Settings`)
};

const es_developerportal_components_accountselector_advancedsettings3 = /** @type {(inputs: Developerportal_Components_Accountselector_Advancedsettings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración Avanzada`)
};

const fr_developerportal_components_accountselector_advancedsettings3 = /** @type {(inputs: Developerportal_Components_Accountselector_Advancedsettings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paramètres Avancés`)
};

const ar_developerportal_components_accountselector_advancedsettings3 = /** @type {(inputs: Developerportal_Components_Accountselector_Advancedsettings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإعدادات المتقدمة`)
};

/**
* | output |
* | --- |
* | "Advanced Settings" |
*
* @param {Developerportal_Components_Accountselector_Advancedsettings3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_advancedsettings3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Advancedsettings3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Advancedsettings3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_advancedsettings3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_advancedsettings3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_advancedsettings3(inputs)
	return ar_developerportal_components_accountselector_advancedsettings3(inputs)
});
export { developerportal_components_accountselector_advancedsettings3 as "developerPortal.components.accountSelector.advancedSettings" }