/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Sectiontitles_Issuer3Inputs */

const en_developerportal_credentialbuilder_sectiontitles_issuer3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Issuer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer`)
};

const es_developerportal_credentialbuilder_sectiontitles_issuer3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Issuer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisor`)
};

const fr_developerportal_credentialbuilder_sectiontitles_issuer3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Issuer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émetteur`)
};

const ar_developerportal_credentialbuilder_sectiontitles_issuer3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Issuer3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المصدر`)
};

/**
* | output |
* | --- |
* | "Issuer" |
*
* @param {Developerportal_Credentialbuilder_Sectiontitles_Issuer3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_sectiontitles_issuer3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Sectiontitles_Issuer3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Sectiontitles_Issuer3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_sectiontitles_issuer3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_sectiontitles_issuer3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_sectiontitles_issuer3(inputs)
	return ar_developerportal_credentialbuilder_sectiontitles_issuer3(inputs)
});
export { developerportal_credentialbuilder_sectiontitles_issuer3 as "developerPortal.credentialBuilder.sectionTitles.issuer" }