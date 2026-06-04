/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Showcode1Inputs */

const en_contacts_showcode1 = /** @type {(inputs: Contacts_Showcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show Code`)
};

const es_contacts_showcode1 = /** @type {(inputs: Contacts_Showcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar código`)
};

const de_contacts_showcode1 = /** @type {(inputs: Contacts_Showcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code anzeigen`)
};

const ar_contacts_showcode1 = /** @type {(inputs: Contacts_Showcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إظهار الكود`)
};

const fr_contacts_showcode1 = /** @type {(inputs: Contacts_Showcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher le code`)
};

const ko_contacts_showcode1 = /** @type {(inputs: Contacts_Showcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`코드 표시`)
};

/**
* | output |
* | --- |
* | "Show Code" |
*
* @param {Contacts_Showcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_showcode1 = /** @type {((inputs?: Contacts_Showcode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Showcode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_showcode1(inputs)
	if (locale === "es") return es_contacts_showcode1(inputs)
	if (locale === "de") return de_contacts_showcode1(inputs)
	if (locale === "ar") return ar_contacts_showcode1(inputs)
	if (locale === "fr") return fr_contacts_showcode1(inputs)
	return ko_contacts_showcode1(inputs)
});
export { contacts_showcode1 as "contacts.showCode" }