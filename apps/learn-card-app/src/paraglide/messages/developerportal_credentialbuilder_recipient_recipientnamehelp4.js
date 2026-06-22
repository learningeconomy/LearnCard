/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Recipient_Recipientnamehelp4Inputs */

const en_developerportal_credentialbuilder_recipient_recipientnamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientnamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The name of the person receiving this credential`)
};

const es_developerportal_credentialbuilder_recipient_recipientnamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientnamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El nombre de la persona que recibe esta credencial`)
};

const fr_developerportal_credentialbuilder_recipient_recipientnamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientnamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le nom de la personne recevant ce crédential`)
};

const ar_developerportal_credentialbuilder_recipient_recipientnamehelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Recipient_Recipientnamehelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الشخص الذي يتلقى هذا الاعتماد`)
};

/**
* | output |
* | --- |
* | "The name of the person receiving this credential" |
*
* @param {Developerportal_Credentialbuilder_Recipient_Recipientnamehelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_recipient_recipientnamehelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Recipient_Recipientnamehelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Recipient_Recipientnamehelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_recipient_recipientnamehelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_recipient_recipientnamehelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_recipient_recipientnamehelp4(inputs)
	return ar_developerportal_credentialbuilder_recipient_recipientnamehelp4(inputs)
});
export { developerportal_credentialbuilder_recipient_recipientnamehelp4 as "developerPortal.credentialBuilder.recipient.recipientNameHelp" }