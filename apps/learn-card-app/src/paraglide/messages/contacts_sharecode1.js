/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Sharecode1Inputs */

const en_contacts_sharecode1 = /** @type {(inputs: Contacts_Sharecode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Code`)
};

const es_contacts_sharecode1 = /** @type {(inputs: Contacts_Sharecode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir código`)
};

const de_contacts_sharecode1 = /** @type {(inputs: Contacts_Sharecode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code teilen`)
};

const ar_contacts_sharecode1 = /** @type {(inputs: Contacts_Sharecode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الكود`)
};

const fr_contacts_sharecode1 = /** @type {(inputs: Contacts_Sharecode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager le code`)
};

const ko_contacts_sharecode1 = /** @type {(inputs: Contacts_Sharecode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`코드 공유`)
};

/**
* | output |
* | --- |
* | "Share Code" |
*
* @param {Contacts_Sharecode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_sharecode1 = /** @type {((inputs?: Contacts_Sharecode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Sharecode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_sharecode1(inputs)
	if (locale === "es") return es_contacts_sharecode1(inputs)
	if (locale === "de") return de_contacts_sharecode1(inputs)
	if (locale === "ar") return ar_contacts_sharecode1(inputs)
	if (locale === "fr") return fr_contacts_sharecode1(inputs)
	return ko_contacts_sharecode1(inputs)
});
export { contacts_sharecode1 as "contacts.shareCode" }