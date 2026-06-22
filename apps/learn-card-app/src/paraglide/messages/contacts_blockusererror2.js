/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Blockusererror2Inputs */

const en_contacts_blockusererror2 = /** @type {(inputs: Contacts_Blockusererror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred, unable to block user`)
};

const es_contacts_blockusererror2 = /** @type {(inputs: Contacts_Blockusererror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo bloquear al usuario`)
};

const fr_contacts_blockusererror2 = /** @type {(inputs: Contacts_Blockusererror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite, impossible de bloquer l'utilisateur`)
};

const ar_contacts_blockusererror2 = /** @type {(inputs: Contacts_Blockusererror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذّر حظر المستخدم`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to block user" |
*
* @param {Contacts_Blockusererror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_blockusererror2 = /** @type {((inputs?: Contacts_Blockusererror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Blockusererror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_blockusererror2(inputs)
	if (locale === "es") return es_contacts_blockusererror2(inputs)
	if (locale === "fr") return fr_contacts_blockusererror2(inputs)
	return ar_contacts_blockusererror2(inputs)
});
export { contacts_blockusererror2 as "contacts.blockUserError" }