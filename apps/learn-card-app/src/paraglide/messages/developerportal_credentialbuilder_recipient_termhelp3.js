/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Termhelp3Inputs */

const en_developerportal_credentialbuilder_recipient_termhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Termhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Academic term`)
};

const es_developerportal_credentialbuilder_recipient_termhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Termhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Periodo académico`)
};

const fr_developerportal_credentialbuilder_recipient_termhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Termhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Période académique`)
};

const ar_developerportal_credentialbuilder_recipient_termhelp3 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Termhelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الفصل الأكاديمي`)
};

/**
* | output |
* | --- |
* | "Academic term" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Termhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_termhelp3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Termhelp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Termhelp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_termhelp3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_termhelp3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_termhelp3(inputs)
	return ar_developerportal_credentialbuilder_recipient_termhelp3(inputs)
});
export { developerportal_credentialbuilder_recipient_termhelp3 as "developerPortal.credentialBuilder.recipient.termHelp" }