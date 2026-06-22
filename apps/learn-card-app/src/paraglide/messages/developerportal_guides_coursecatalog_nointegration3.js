/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Coursecatalog_Nointegration3Inputs */

const en_developerportal_guides_coursecatalog_nointegration3 = /** @type {(inputs: Developerportal_Guides_Coursecatalog_Nointegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select an integration from the header dropdown to continue.`)
};

const es_developerportal_guides_coursecatalog_nointegration3 = /** @type {(inputs: Developerportal_Guides_Coursecatalog_Nointegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select an integration from the header dropdown to continue.`)
};

const fr_developerportal_guides_coursecatalog_nointegration3 = /** @type {(inputs: Developerportal_Guides_Coursecatalog_Nointegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select an integration from the header dropdown to continue.`)
};

const ar_developerportal_guides_coursecatalog_nointegration3 = /** @type {(inputs: Developerportal_Guides_Coursecatalog_Nointegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select an integration from the header dropdown to continue.`)
};

/**
* | output |
* | --- |
* | "Please select an integration from the header dropdown to continue." |
*
* @param {Developerportal_Guides_Coursecatalog_Nointegration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_coursecatalog_nointegration3 = /** @type {((inputs?: Developerportal_Guides_Coursecatalog_Nointegration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Coursecatalog_Nointegration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_coursecatalog_nointegration3(inputs)
	if (locale === "es") return es_developerportal_guides_coursecatalog_nointegration3(inputs)
	if (locale === "fr") return fr_developerportal_guides_coursecatalog_nointegration3(inputs)
	return ar_developerportal_guides_coursecatalog_nointegration3(inputs)
});
export { developerportal_guides_coursecatalog_nointegration3 as "developerPortal.guides.courseCatalog.noIntegration" }