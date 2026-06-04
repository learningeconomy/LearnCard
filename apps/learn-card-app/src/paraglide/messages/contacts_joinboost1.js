/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Joinboost1Inputs */

const en_contacts_joinboost1 = /** @type {(inputs: Contacts_Joinboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join`)
};

const es_contacts_joinboost1 = /** @type {(inputs: Contacts_Joinboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unirse`)
};

const de_contacts_joinboost1 = /** @type {(inputs: Contacts_Joinboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beitreten`)
};

const ar_contacts_joinboost1 = /** @type {(inputs: Contacts_Joinboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انضمام`)
};

const fr_contacts_joinboost1 = /** @type {(inputs: Contacts_Joinboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoindre`)
};

const ko_contacts_joinboost1 = /** @type {(inputs: Contacts_Joinboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`가입`)
};

/**
* | output |
* | --- |
* | "Join" |
*
* @param {Contacts_Joinboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_joinboost1 = /** @type {((inputs?: Contacts_Joinboost1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Joinboost1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_joinboost1(inputs)
	if (locale === "es") return es_contacts_joinboost1(inputs)
	if (locale === "de") return de_contacts_joinboost1(inputs)
	if (locale === "ar") return ar_contacts_joinboost1(inputs)
	if (locale === "fr") return fr_contacts_joinboost1(inputs)
	return ko_contacts_joinboost1(inputs)
});
export { contacts_joinboost1 as "contacts.joinBoost" }