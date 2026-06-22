/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Mycontactcard2Inputs */

const en_contacts_mycontactcard2 = /** @type {(inputs: Contacts_Mycontactcard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Contact Card`)
};

const es_contacts_mycontactcard2 = /** @type {(inputs: Contacts_Mycontactcard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi tarjeta de contacto`)
};

const fr_contacts_mycontactcard2 = /** @type {(inputs: Contacts_Mycontactcard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ma carte de contact`)
};

const ar_contacts_mycontactcard2 = /** @type {(inputs: Contacts_Mycontactcard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بطاقة الاتصال الخاصة بي`)
};

/**
* | output |
* | --- |
* | "My Contact Card" |
*
* @param {Contacts_Mycontactcard2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_mycontactcard2 = /** @type {((inputs?: Contacts_Mycontactcard2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Mycontactcard2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_mycontactcard2(inputs)
	if (locale === "es") return es_contacts_mycontactcard2(inputs)
	if (locale === "fr") return fr_contacts_mycontactcard2(inputs)
	return ar_contacts_mycontactcard2(inputs)
});
export { contacts_mycontactcard2 as "contacts.myContactCard" }