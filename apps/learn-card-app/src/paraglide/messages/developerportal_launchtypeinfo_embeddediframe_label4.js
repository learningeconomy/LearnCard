/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Launchtypeinfo_Embeddediframe_Label4Inputs */

const en_developerportal_launchtypeinfo_embeddediframe_label4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Embeddediframe_Label4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embedded Iframe`)
};

const es_developerportal_launchtypeinfo_embeddediframe_label4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Embeddediframe_Label4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embedded Iframe`)
};

const fr_developerportal_launchtypeinfo_embeddediframe_label4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Embeddediframe_Label4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embedded Iframe`)
};

const ar_developerportal_launchtypeinfo_embeddediframe_label4 = /** @type {(inputs: Developerportal_Launchtypeinfo_Embeddediframe_Label4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embedded Iframe`)
};

/**
* | output |
* | --- |
* | "Embedded Iframe" |
*
* @param {Developerportal_Launchtypeinfo_Embeddediframe_Label4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_launchtypeinfo_embeddediframe_label4 = /** @type {((inputs?: Developerportal_Launchtypeinfo_Embeddediframe_Label4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Launchtypeinfo_Embeddediframe_Label4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_launchtypeinfo_embeddediframe_label4(inputs)
	if (locale === "es") return es_developerportal_launchtypeinfo_embeddediframe_label4(inputs)
	if (locale === "fr") return fr_developerportal_launchtypeinfo_embeddediframe_label4(inputs)
	return ar_developerportal_launchtypeinfo_embeddediframe_label4(inputs)
});
export { developerportal_launchtypeinfo_embeddediframe_label4 as "developerPortal.launchTypeInfo.embeddedIframe.label" }