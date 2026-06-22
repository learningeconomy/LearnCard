/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Badge1Inputs */

const en_developerportal_guides_hub_badge1 = /** @type {(inputs: Developerportal_Guides_Hub_Badge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration Guides`)
};

const es_developerportal_guides_hub_badge1 = /** @type {(inputs: Developerportal_Guides_Hub_Badge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guías de Integración`)
};

const fr_developerportal_guides_hub_badge1 = /** @type {(inputs: Developerportal_Guides_Hub_Badge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guides d'Intégration`)
};

const ar_developerportal_guides_hub_badge1 = /** @type {(inputs: Developerportal_Guides_Hub_Badge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدلة التكامل`)
};

/**
* | output |
* | --- |
* | "Integration Guides" |
*
* @param {Developerportal_Guides_Hub_Badge1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_badge1 = /** @type {((inputs?: Developerportal_Guides_Hub_Badge1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Badge1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_badge1(inputs)
	if (locale === "es") return es_developerportal_guides_hub_badge1(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_badge1(inputs)
	return ar_developerportal_guides_hub_badge1(inputs)
});
export { developerportal_guides_hub_badge1 as "developerPortal.guides.hub.badge" }