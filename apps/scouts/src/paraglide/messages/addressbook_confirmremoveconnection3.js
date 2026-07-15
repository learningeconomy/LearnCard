/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Confirmremoveconnection3Inputs */

const en_addressbook_confirmremoveconnection3 = /** @type {(inputs: Addressbook_Confirmremoveconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove this connection?`)
};

const es_addressbook_confirmremoveconnection3 = /** @type {(inputs: Addressbook_Confirmremoveconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres eliminar esta conexión?`)
};

const fr_addressbook_confirmremoveconnection3 = /** @type {(inputs: Addressbook_Confirmremoveconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer cette connexion ?`)
};

const ar_addressbook_confirmremoveconnection3 = /** @type {(inputs: Addressbook_Confirmremoveconnection3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove this connection?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to remove this connection?" |
*
* @param {Addressbook_Confirmremoveconnection3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_confirmremoveconnection3 = /** @type {((inputs?: Addressbook_Confirmremoveconnection3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Confirmremoveconnection3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_confirmremoveconnection3(inputs)
	if (locale === "es") return es_addressbook_confirmremoveconnection3(inputs)
	if (locale === "fr") return fr_addressbook_confirmremoveconnection3(inputs)
	return ar_addressbook_confirmremoveconnection3(inputs)
});
export { addressbook_confirmremoveconnection3 as "addressBook.confirmRemoveConnection" }