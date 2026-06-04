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

const de_contacts_claimed = /** @type {(inputs: Contacts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beansprucht`)
};

const ar_contacts_claimed = /** @type {(inputs: Contacts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطالب به`)
};

const fr_contacts_claimed = /** @type {(inputs: Contacts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamé`)
};

const ko_contacts_claimed = /** @type {(inputs: Contacts_ClaimedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`획득함`)
};

/**
* | output |
* | --- |
* | "Claimed" |
*
* @param {Contacts_ClaimedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_claimed = /** @type {((inputs?: Contacts_ClaimedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_ClaimedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_claimed(inputs)
	if (locale === "es") return es_contacts_claimed(inputs)
	if (locale === "de") return de_contacts_claimed(inputs)
	if (locale === "ar") return ar_contacts_claimed(inputs)
	if (locale === "fr") return fr_contacts_claimed(inputs)
	return ko_contacts_claimed(inputs)
});
export { contacts_claimed as "contacts.claimed" }