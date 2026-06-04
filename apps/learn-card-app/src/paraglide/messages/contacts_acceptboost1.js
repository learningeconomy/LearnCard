/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Acceptboost1Inputs */

const en_contacts_acceptboost1 = /** @type {(inputs: Contacts_Acceptboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept`)
};

const es_contacts_acceptboost1 = /** @type {(inputs: Contacts_Acceptboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar`)
};

const de_contacts_acceptboost1 = /** @type {(inputs: Contacts_Acceptboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annehmen`)
};

const ar_contacts_acceptboost1 = /** @type {(inputs: Contacts_Acceptboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول`)
};

const fr_contacts_acceptboost1 = /** @type {(inputs: Contacts_Acceptboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter`)
};

const ko_contacts_acceptboost1 = /** @type {(inputs: Contacts_Acceptboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수락`)
};

/**
* | output |
* | --- |
* | "Accept" |
*
* @param {Contacts_Acceptboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_acceptboost1 = /** @type {((inputs?: Contacts_Acceptboost1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Acceptboost1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_acceptboost1(inputs)
	if (locale === "es") return es_contacts_acceptboost1(inputs)
	if (locale === "de") return de_contacts_acceptboost1(inputs)
	if (locale === "ar") return ar_contacts_acceptboost1(inputs)
	if (locale === "fr") return fr_contacts_acceptboost1(inputs)
	return ko_contacts_acceptboost1(inputs)
});
export { contacts_acceptboost1 as "contacts.acceptBoost" }