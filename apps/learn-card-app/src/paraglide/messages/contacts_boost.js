/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_BoostInputs */

const en_contacts_boost = /** @type {(inputs: Contacts_BoostInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const es_contacts_boost = /** @type {(inputs: Contacts_BoostInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const fr_contacts_boost = /** @type {(inputs: Contacts_BoostInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost`)
};

const ar_contacts_boost = /** @type {(inputs: Contacts_BoostInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ترقية`)
};

/**
* | output |
* | --- |
* | "Boost" |
*
* @param {Contacts_BoostInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_boost = /** @type {((inputs?: Contacts_BoostInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_BoostInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_boost(inputs)
	if (locale === "es") return es_contacts_boost(inputs)
	if (locale === "fr") return fr_contacts_boost(inputs)
	return ar_contacts_boost(inputs)
});
export { contacts_boost as "contacts.boost" }