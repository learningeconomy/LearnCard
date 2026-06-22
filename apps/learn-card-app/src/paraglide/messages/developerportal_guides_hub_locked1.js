/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Locked1Inputs */

const en_developerportal_guides_hub_locked1 = /** @type {(inputs: Developerportal_Guides_Hub_Locked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Locked`)
};

const es_developerportal_guides_hub_locked1 = /** @type {(inputs: Developerportal_Guides_Hub_Locked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloqueado`)
};

const fr_developerportal_guides_hub_locked1 = /** @type {(inputs: Developerportal_Guides_Hub_Locked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verrouillé`)
};

const ar_developerportal_guides_hub_locked1 = /** @type {(inputs: Developerportal_Guides_Hub_Locked1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقفل`)
};

/**
* | output |
* | --- |
* | "Locked" |
*
* @param {Developerportal_Guides_Hub_Locked1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_locked1 = /** @type {((inputs?: Developerportal_Guides_Hub_Locked1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Locked1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_locked1(inputs)
	if (locale === "es") return es_developerportal_guides_hub_locked1(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_locked1(inputs)
	return ar_developerportal_guides_hub_locked1(inputs)
});
export { developerportal_guides_hub_locked1 as "developerPortal.guides.hub.locked" }