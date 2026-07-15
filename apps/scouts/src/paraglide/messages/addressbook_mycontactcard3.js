/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Mycontactcard3Inputs */

const en_addressbook_mycontactcard3 = /** @type {(inputs: Addressbook_Mycontactcard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Contact Card`)
};

const es_addressbook_mycontactcard3 = /** @type {(inputs: Addressbook_Mycontactcard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi Tarjeta de Contacto`)
};

const fr_addressbook_mycontactcard3 = /** @type {(inputs: Addressbook_Mycontactcard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ma carte de contact`)
};

const ar_addressbook_mycontactcard3 = /** @type {(inputs: Addressbook_Mycontactcard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بطاقة الاتصال الخاصة بي`)
};

/**
* | output |
* | --- |
* | "My Contact Card" |
*
* @param {Addressbook_Mycontactcard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_mycontactcard3 = /** @type {((inputs?: Addressbook_Mycontactcard3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Mycontactcard3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_mycontactcard3(inputs)
	if (locale === "es") return es_addressbook_mycontactcard3(inputs)
	if (locale === "fr") return fr_addressbook_mycontactcard3(inputs)
	return ar_addressbook_mycontactcard3(inputs)
});
export { addressbook_mycontactcard3 as "addressBook.myContactCard" }