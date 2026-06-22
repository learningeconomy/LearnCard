/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Role2Inputs */

const en_developerportal_credentialbuilder_recipient_role2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Role2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Role`)
};

const es_developerportal_credentialbuilder_recipient_role2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Role2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rol`)
};

const fr_developerportal_credentialbuilder_recipient_role2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Role2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rôle`)
};

const ar_developerportal_credentialbuilder_recipient_role2 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Role2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدور`)
};

/**
* | output |
* | --- |
* | "Role" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Role2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_role2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Role2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Role2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_role2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_role2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_role2(inputs)
	return ar_developerportal_credentialbuilder_recipient_role2(inputs)
});
export { developerportal_credentialbuilder_recipient_role2 as "developerPortal.credentialBuilder.recipient.role" }