/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Contacts_Blockedcountlabel2Inputs */

const en_contacts_blockedcountlabel2 = /** @type {(inputs: Contacts_Blockedcountlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Blocked`)
};

const es_contacts_blockedcountlabel2 = /** @type {(inputs: Contacts_Blockedcountlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} bloqueados`)
};

const fr_contacts_blockedcountlabel2 = /** @type {(inputs: Contacts_Blockedcountlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} bloqués`)
};

const ar_contacts_blockedcountlabel2 = /** @type {(inputs: Contacts_Blockedcountlabel2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} محظور`)
};

/**
* | output |
* | --- |
* | "{count} Blocked" |
*
* @param {Contacts_Blockedcountlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_blockedcountlabel2 = /** @type {((inputs: Contacts_Blockedcountlabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Blockedcountlabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_blockedcountlabel2(inputs)
	if (locale === "es") return es_contacts_blockedcountlabel2(inputs)
	if (locale === "fr") return fr_contacts_blockedcountlabel2(inputs)
	return ar_contacts_blockedcountlabel2(inputs)
});
export { contacts_blockedcountlabel2 as "contacts.blockedCountLabel" }