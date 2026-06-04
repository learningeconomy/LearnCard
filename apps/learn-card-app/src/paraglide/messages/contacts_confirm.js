/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_ConfirmInputs */

const en_contacts_confirm = /** @type {(inputs: Contacts_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm`)
};

const es_contacts_confirm = /** @type {(inputs: Contacts_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmar`)
};

const de_contacts_confirm = /** @type {(inputs: Contacts_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bestätigen`)
};

const ar_contacts_confirm = /** @type {(inputs: Contacts_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكيد`)
};

const fr_contacts_confirm = /** @type {(inputs: Contacts_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmer`)
};

const ko_contacts_confirm = /** @type {(inputs: Contacts_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인`)
};

/**
* | output |
* | --- |
* | "Confirm" |
*
* @param {Contacts_ConfirmInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_confirm = /** @type {((inputs?: Contacts_ConfirmInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_ConfirmInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirm(inputs)
	if (locale === "es") return es_contacts_confirm(inputs)
	if (locale === "de") return de_contacts_confirm(inputs)
	if (locale === "ar") return ar_contacts_confirm(inputs)
	if (locale === "fr") return fr_contacts_confirm(inputs)
	return ko_contacts_confirm(inputs)
});
export { contacts_confirm as "contacts.confirm" }