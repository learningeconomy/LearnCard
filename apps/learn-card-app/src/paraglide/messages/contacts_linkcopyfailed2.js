/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Linkcopyfailed2Inputs */

const en_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Contact link to clipboard`)
};

const es_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de contacto`)
};

const de_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontaktlink konnte nicht kopiert werden`)
};

const ar_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط جهة الاتصال`)
};

const fr_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de contact`)
};

const ko_contacts_linkcopyfailed2 = /** @type {(inputs: Contacts_Linkcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처 링크를 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy Contact link to clipboard" |
*
* @param {Contacts_Linkcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_linkcopyfailed2 = /** @type {((inputs?: Contacts_Linkcopyfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Linkcopyfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_linkcopyfailed2(inputs)
	if (locale === "es") return es_contacts_linkcopyfailed2(inputs)
	if (locale === "de") return de_contacts_linkcopyfailed2(inputs)
	if (locale === "ar") return ar_contacts_linkcopyfailed2(inputs)
	if (locale === "fr") return fr_contacts_linkcopyfailed2(inputs)
	return ko_contacts_linkcopyfailed2(inputs)
});
export { contacts_linkcopyfailed2 as "contacts.linkCopyFailed" }