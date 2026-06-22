/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Hardblocklabel5Inputs */

const en_developerportal_components_appdetailsstep_hardblocklabel5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Hardblocklabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hard block`)
};

const es_developerportal_components_appdetailsstep_hardblocklabel5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Hardblocklabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloqueo duro`)
};

const fr_developerportal_components_appdetailsstep_hardblocklabel5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Hardblocklabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blocage strict`)
};

const ar_developerportal_components_appdetailsstep_hardblocklabel5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Hardblocklabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حظر صارم`)
};

/**
* | output |
* | --- |
* | "Hard block" |
*
* @param {Developerportal_Components_Appdetailsstep_Hardblocklabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_hardblocklabel5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Hardblocklabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Hardblocklabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_hardblocklabel5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_hardblocklabel5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_hardblocklabel5(inputs)
	return ar_developerportal_components_appdetailsstep_hardblocklabel5(inputs)
});
export { developerportal_components_appdetailsstep_hardblocklabel5 as "developerPortal.components.appDetailsStep.hardBlockLabel" }