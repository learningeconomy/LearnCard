/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Statusbadge2Inputs */

const en_developerportal_components_statusbadge2 = /** @type {(inputs: Developerportal_Components_Statusbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (``)
};

const es_developerportal_components_statusbadge2 = /** @type {(inputs: Developerportal_Components_Statusbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (``)
};

const fr_developerportal_components_statusbadge2 = /** @type {(inputs: Developerportal_Components_Statusbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (``)
};

const ar_developerportal_components_statusbadge2 = /** @type {(inputs: Developerportal_Components_Statusbadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (``)
};

/**
* | output |
* | --- |
* | "" |
*
* @param {Developerportal_Components_Statusbadge2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_statusbadge2 = /** @type {((inputs?: Developerportal_Components_Statusbadge2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Statusbadge2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_statusbadge2(inputs)
	if (locale === "es") return es_developerportal_components_statusbadge2(inputs)
	if (locale === "fr") return fr_developerportal_components_statusbadge2(inputs)
	return ar_developerportal_components_statusbadge2(inputs)
});
export { developerportal_components_statusbadge2 as "developerPortal.components.statusBadge" }