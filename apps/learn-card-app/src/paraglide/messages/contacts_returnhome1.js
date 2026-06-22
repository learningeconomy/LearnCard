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

const fr_contacts_returnhome1 = /** @type {(inputs: Contacts_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour à l'accueil`)
};

const ar_contacts_returnhome1 = /** @type {(inputs: Contacts_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة للرئيسية`)
};

/**
* | output |
* | --- |
* | "Return home" |
*
* @param {Contacts_Returnhome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_returnhome1 = /** @type {((inputs?: Contacts_Returnhome1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Returnhome1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_returnhome1(inputs)
	if (locale === "es") return es_contacts_returnhome1(inputs)
	if (locale === "fr") return fr_contacts_returnhome1(inputs)
	return ar_contacts_returnhome1(inputs)
});
export { contacts_returnhome1 as "contacts.returnHome" }