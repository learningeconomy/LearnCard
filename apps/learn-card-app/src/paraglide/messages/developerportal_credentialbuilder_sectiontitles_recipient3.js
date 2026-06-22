/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Sectiontitles_Recipient3Inputs */

const en_developerportal_credentialbuilder_sectiontitles_recipient3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Recipient3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient & Activity`)
};

const es_developerportal_credentialbuilder_sectiontitles_recipient3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Recipient3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinatario y Actividad`)
};

const fr_developerportal_credentialbuilder_sectiontitles_recipient3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Recipient3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinataire et Activité`)
};

const ar_developerportal_credentialbuilder_sectiontitles_recipient3 = /** @type {(inputs: Developerportal_Credentialbuilder_Sectiontitles_Recipient3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستلم والنشاط`)
};

/**
* | output |
* | --- |
* | "Recipient & Activity" |
*
* @param {Developerportal_Credentialbuilder_Sectiontitles_Recipient3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_sectiontitles_recipient3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Sectiontitles_Recipient3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Sectiontitles_Recipient3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_sectiontitles_recipient3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_sectiontitles_recipient3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_sectiontitles_recipient3(inputs)
	return ar_developerportal_credentialbuilder_sectiontitles_recipient3(inputs)
});
export { developerportal_credentialbuilder_sectiontitles_recipient3 as "developerPortal.credentialBuilder.sectionTitles.recipient" }