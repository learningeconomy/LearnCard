/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Confirmremoveconnection2Inputs */

const en_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove this connection?`)
};

const es_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres eliminar esta conexión?`)
};

const fr_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment supprimer cette connexion ?`)
};

const ar_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إزالة هذا الاتصال؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to remove this connection?" |
*
* @param {Contacts_Confirmremoveconnection2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_confirmremoveconnection2 = /** @type {((inputs?: Contacts_Confirmremoveconnection2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmremoveconnection2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmremoveconnection2(inputs)
	if (locale === "es") return es_contacts_confirmremoveconnection2(inputs)
	if (locale === "fr") return fr_contacts_confirmremoveconnection2(inputs)
	return ar_contacts_confirmremoveconnection2(inputs)
});
export { contacts_confirmremoveconnection2 as "contacts.confirmRemoveConnection" }