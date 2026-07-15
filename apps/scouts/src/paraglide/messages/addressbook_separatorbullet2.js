/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Separatorbullet2Inputs */

const en_addressbook_separatorbullet2 = /** @type {(inputs: Addressbook_Separatorbullet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` • `)
};

const es_addressbook_separatorbullet2 = /** @type {(inputs: Addressbook_Separatorbullet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` • `)
};

const fr_addressbook_separatorbullet2 = /** @type {(inputs: Addressbook_Separatorbullet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` • `)
};

const ar_addressbook_separatorbullet2 = /** @type {(inputs: Addressbook_Separatorbullet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` • `)
};

/**
* | output |
* | --- |
* | "•" |
*
* @param {Addressbook_Separatorbullet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_separatorbullet2 = /** @type {((inputs?: Addressbook_Separatorbullet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Separatorbullet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_separatorbullet2(inputs)
	if (locale === "es") return es_addressbook_separatorbullet2(inputs)
	if (locale === "fr") return fr_addressbook_separatorbullet2(inputs)
	return ar_addressbook_separatorbullet2(inputs)
});
export { addressbook_separatorbullet2 as "addressBook.separatorBullet" }