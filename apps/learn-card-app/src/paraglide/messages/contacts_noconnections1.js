/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Noconnections1Inputs */

const en_contacts_noconnections1 = /** @type {(inputs: Contacts_Noconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No connections yet.`)
};

const es_contacts_noconnections1 = /** @type {(inputs: Contacts_Noconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay conexiones.`)
};

const fr_contacts_noconnections1 = /** @type {(inputs: Contacts_Noconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune connexion pour le moment.`)
};

const ar_contacts_noconnections1 = /** @type {(inputs: Contacts_Noconnections1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد اتصالات بعد.`)
};

/**
* | output |
* | --- |
* | "No connections yet." |
*
* @param {Contacts_Noconnections1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_noconnections1 = /** @type {((inputs?: Contacts_Noconnections1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Noconnections1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_noconnections1(inputs)
	if (locale === "es") return es_contacts_noconnections1(inputs)
	if (locale === "fr") return fr_contacts_noconnections1(inputs)
	return ar_contacts_noconnections1(inputs)
});
export { contacts_noconnections1 as "contacts.noConnections" }