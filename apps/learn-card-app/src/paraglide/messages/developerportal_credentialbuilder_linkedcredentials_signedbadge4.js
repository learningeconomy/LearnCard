/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Linkedcredentials_Signedbadge4Inputs */

const en_developerportal_credentialbuilder_linkedcredentials_signedbadge4 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_Signedbadge4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`signed`)
};

const es_developerportal_credentialbuilder_linkedcredentials_signedbadge4 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_Signedbadge4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`firmado`)
};

const fr_developerportal_credentialbuilder_linkedcredentials_signedbadge4 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_Signedbadge4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`signé`)
};

const ar_developerportal_credentialbuilder_linkedcredentials_signedbadge4 = /** @type {(inputs: Developerportal_Credentialbuilder_Linkedcredentials_Signedbadge4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موقع`)
};

/**
* | output |
* | --- |
* | "signed" |
*
* @param {Developerportal_Credentialbuilder_Linkedcredentials_Signedbadge4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_linkedcredentials_signedbadge4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Linkedcredentials_Signedbadge4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Linkedcredentials_Signedbadge4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_linkedcredentials_signedbadge4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_linkedcredentials_signedbadge4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_linkedcredentials_signedbadge4(inputs)
	return ar_developerportal_credentialbuilder_linkedcredentials_signedbadge4(inputs)
});
export { developerportal_credentialbuilder_linkedcredentials_signedbadge4 as "developerPortal.credentialBuilder.linkedCredentials.signedBadge" }