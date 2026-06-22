/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Softblocklabel5Inputs */

const en_developerportal_components_appdetailsstep_softblocklabel5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Softblocklabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soft block`)
};

const es_developerportal_components_appdetailsstep_softblocklabel5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Softblocklabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloqueo suave`)
};

const fr_developerportal_components_appdetailsstep_softblocklabel5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Softblocklabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blocage souple`)
};

const ar_developerportal_components_appdetailsstep_softblocklabel5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Softblocklabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حظر مرن`)
};

/**
* | output |
* | --- |
* | "Soft block" |
*
* @param {Developerportal_Components_Appdetailsstep_Softblocklabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_softblocklabel5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Softblocklabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Softblocklabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_softblocklabel5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_softblocklabel5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_softblocklabel5(inputs)
	return ar_developerportal_components_appdetailsstep_softblocklabel5(inputs)
});
export { developerportal_components_appdetailsstep_softblocklabel5 as "developerPortal.components.appDetailsStep.softBlockLabel" }