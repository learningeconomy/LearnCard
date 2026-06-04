/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_ConnectInputs */

const en_contacts_connect = /** @type {(inputs: Contacts_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect`)
};

const es_contacts_connect = /** @type {(inputs: Contacts_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar`)
};

const de_contacts_connect = /** @type {(inputs: Contacts_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbinden`)
};

const ar_contacts_connect = /** @type {(inputs: Contacts_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اتصال`)
};

const fr_contacts_connect = /** @type {(inputs: Contacts_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecter`)
};

const ko_contacts_connect = /** @type {(inputs: Contacts_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결`)
};

/**
* | output |
* | --- |
* | "Connect" |
*
* @param {Contacts_ConnectInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_connect = /** @type {((inputs?: Contacts_ConnectInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_ConnectInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connect(inputs)
	if (locale === "es") return es_contacts_connect(inputs)
	if (locale === "de") return de_contacts_connect(inputs)
	if (locale === "ar") return ar_contacts_connect(inputs)
	if (locale === "fr") return fr_contacts_connect(inputs)
	return ko_contacts_connect(inputs)
});
export { contacts_connect as "contacts.connect" }