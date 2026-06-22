/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_ClaimedInputs */

const en_contacts_claimed = /** @type {(inputs: Contacts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claimed`)
};

const es_contacts_claimed = /** @type {(inputs: Contacts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamado`)
};

const fr_contacts_claimed = /** @type {(inputs: Contacts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamé`)
};

const ar_contacts_claimed = /** @type {(inputs: Contacts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطالب به`)
};

/**
* | output |
* | --- |
* | "Claimed" |
*
* @param {Contacts_ClaimedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_claimed = /** @type {((inputs?: Contacts_ClaimedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_ClaimedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_claimed(inputs)
	if (locale === "es") return es_contacts_claimed(inputs)
	if (locale === "fr") return fr_contacts_claimed(inputs)
	return ar_contacts_claimed(inputs)
});
export { contacts_claimed as "contacts.claimed" }