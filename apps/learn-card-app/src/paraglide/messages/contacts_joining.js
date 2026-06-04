/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_JoiningInputs */

const en_contacts_joining = /** @type {(inputs: Contacts_JoiningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Joining...`)
};

const es_contacts_joining = /** @type {(inputs: Contacts_JoiningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uniéndose...`)
};

const de_contacts_joining = /** @type {(inputs: Contacts_JoiningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beitreten...`)
};

const ar_contacts_joining = /** @type {(inputs: Contacts_JoiningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...انضمام`)
};

const fr_contacts_joining = /** @type {(inputs: Contacts_JoiningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En cours de rejoindre...`)
};

const ko_contacts_joining = /** @type {(inputs: Contacts_JoiningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`가입 중...`)
};

/**
* | output |
* | --- |
* | "Joining..." |
*
* @param {Contacts_JoiningInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_joining = /** @type {((inputs?: Contacts_JoiningInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_JoiningInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_joining(inputs)
	if (locale === "es") return es_contacts_joining(inputs)
	if (locale === "de") return de_contacts_joining(inputs)
	if (locale === "ar") return ar_contacts_joining(inputs)
	if (locale === "fr") return fr_contacts_joining(inputs)
	return ko_contacts_joining(inputs)
});
export { contacts_joining as "contacts.joining" }