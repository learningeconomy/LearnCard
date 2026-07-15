/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Profileidprefix3Inputs */

const en_addressbook_profileidprefix3 = /** @type {(inputs: Addressbook_Profileidprefix3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`@`)
};

const es_addressbook_profileidprefix3 = /** @type {(inputs: Addressbook_Profileidprefix3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`@`)
};

const fr_addressbook_profileidprefix3 = /** @type {(inputs: Addressbook_Profileidprefix3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`@`)
};

const ar_addressbook_profileidprefix3 = /** @type {(inputs: Addressbook_Profileidprefix3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`@`)
};

/**
* | output |
* | --- |
* | "@" |
*
* @param {Addressbook_Profileidprefix3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_profileidprefix3 = /** @type {((inputs?: Addressbook_Profileidprefix3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Profileidprefix3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_profileidprefix3(inputs)
	if (locale === "es") return es_addressbook_profileidprefix3(inputs)
	if (locale === "fr") return fr_addressbook_profileidprefix3(inputs)
	return ar_addressbook_profileidprefix3(inputs)
});
export { addressbook_profileidprefix3 as "addressBook.profileIdPrefix" }