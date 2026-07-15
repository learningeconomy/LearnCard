/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Noconnections2Inputs */

const en_addressbook_noconnections2 = /** @type {(inputs: Addressbook_Noconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No connections yet.`)
};

const es_addressbook_noconnections2 = /** @type {(inputs: Addressbook_Noconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún sin conexiones.`)
};

const fr_addressbook_noconnections2 = /** @type {(inputs: Addressbook_Noconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune connexion pour l'instant.`)
};

const ar_addressbook_noconnections2 = /** @type {(inputs: Addressbook_Noconnections2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد اتصالات بعد.`)
};

/**
* | output |
* | --- |
* | "No connections yet." |
*
* @param {Addressbook_Noconnections2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_noconnections2 = /** @type {((inputs?: Addressbook_Noconnections2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Noconnections2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_noconnections2(inputs)
	if (locale === "es") return es_addressbook_noconnections2(inputs)
	if (locale === "fr") return fr_addressbook_noconnections2(inputs)
	return ar_addressbook_noconnections2(inputs)
});
export { addressbook_noconnections2 as "addressBook.noConnections" }