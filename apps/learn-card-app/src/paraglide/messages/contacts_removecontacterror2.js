/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Removecontacterror2Inputs */

const en_contacts_removecontacterror2 = /** @type {(inputs: Contacts_Removecontacterror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred, unable to remove contact`)
};

const es_contacts_removecontacterror2 = /** @type {(inputs: Contacts_Removecontacterror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo eliminar el contacto`)
};

const fr_contacts_removecontacterror2 = /** @type {(inputs: Contacts_Removecontacterror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite, impossible de supprimer le contact`)
};

const ar_contacts_removecontacterror2 = /** @type {(inputs: Contacts_Removecontacterror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذّر إزالة جهة الاتصال`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to remove contact" |
*
* @param {Contacts_Removecontacterror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_removecontacterror2 = /** @type {((inputs?: Contacts_Removecontacterror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Removecontacterror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_removecontacterror2(inputs)
	if (locale === "es") return es_contacts_removecontacterror2(inputs)
	if (locale === "fr") return fr_contacts_removecontacterror2(inputs)
	return ar_contacts_removecontacterror2(inputs)
});
export { contacts_removecontacterror2 as "contacts.removeContactError" }