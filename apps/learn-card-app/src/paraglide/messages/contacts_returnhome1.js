/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Returnhome1Inputs */

const en_contacts_returnhome1 = /** @type {(inputs: Contacts_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Return home`)
};

const es_contacts_returnhome1 = /** @type {(inputs: Contacts_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver al inicio`)
};

const de_contacts_returnhome1 = /** @type {(inputs: Contacts_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zurück zum Start`)
};

const ar_contacts_returnhome1 = /** @type {(inputs: Contacts_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة للرئيسية`)
};

const fr_contacts_returnhome1 = /** @type {(inputs: Contacts_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour à l'accueil`)
};

const ko_contacts_returnhome1 = /** @type {(inputs: Contacts_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`홈으로 돌아가기`)
};

/**
* | output |
* | --- |
* | "Return home" |
*
* @param {Contacts_Returnhome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_returnhome1 = /** @type {((inputs?: Contacts_Returnhome1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Returnhome1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_returnhome1(inputs)
	if (locale === "es") return es_contacts_returnhome1(inputs)
	if (locale === "de") return de_contacts_returnhome1(inputs)
	if (locale === "ar") return ar_contacts_returnhome1(inputs)
	if (locale === "fr") return fr_contacts_returnhome1(inputs)
	return ko_contacts_returnhome1(inputs)
});
export { contacts_returnhome1 as "contacts.returnHome" }