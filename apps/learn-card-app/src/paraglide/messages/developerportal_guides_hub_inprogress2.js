/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Inprogress2Inputs */

const en_developerportal_guides_hub_inprogress2 = /** @type {(inputs: Developerportal_Guides_Hub_Inprogress2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In Progress`)
};

const es_developerportal_guides_hub_inprogress2 = /** @type {(inputs: Developerportal_Guides_Hub_Inprogress2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Progreso`)
};

const fr_developerportal_guides_hub_inprogress2 = /** @type {(inputs: Developerportal_Guides_Hub_Inprogress2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Cours`)
};

const ar_developerportal_guides_hub_inprogress2 = /** @type {(inputs: Developerportal_Guides_Hub_Inprogress2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد التنفيذ`)
};

/**
* | output |
* | --- |
* | "In Progress" |
*
* @param {Developerportal_Guides_Hub_Inprogress2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_inprogress2 = /** @type {((inputs?: Developerportal_Guides_Hub_Inprogress2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Inprogress2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_inprogress2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_inprogress2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_inprogress2(inputs)
	return ar_developerportal_guides_hub_inprogress2(inputs)
});
export { developerportal_guides_hub_inprogress2 as "developerPortal.guides.hub.inProgress" }