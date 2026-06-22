/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Notstarted2Inputs */

const en_developerportal_guides_hub_notstarted2 = /** @type {(inputs: Developerportal_Guides_Hub_Notstarted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not started`)
};

const es_developerportal_guides_hub_notstarted2 = /** @type {(inputs: Developerportal_Guides_Hub_Notstarted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No iniciado`)
};

const fr_developerportal_guides_hub_notstarted2 = /** @type {(inputs: Developerportal_Guides_Hub_Notstarted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas commencé`)
};

const ar_developerportal_guides_hub_notstarted2 = /** @type {(inputs: Developerportal_Guides_Hub_Notstarted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يبدأ`)
};

/**
* | output |
* | --- |
* | "Not started" |
*
* @param {Developerportal_Guides_Hub_Notstarted2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_notstarted2 = /** @type {((inputs?: Developerportal_Guides_Hub_Notstarted2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Notstarted2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_notstarted2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_notstarted2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_notstarted2(inputs)
	return ar_developerportal_guides_hub_notstarted2(inputs)
});
export { developerportal_guides_hub_notstarted2 as "developerPortal.guides.hub.notStarted" }