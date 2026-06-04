/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Linkcopied1Inputs */

const en_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact link copied to clipboard`)
};

const es_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de contacto copiado al portapapeles`)
};

const de_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontaktlink in die Zwischenablage kopiert`)
};

const ar_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط جهة الاتصال إلى الحافظة`)
};

const fr_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de contact copié dans le presse-papiers`)
};

const ko_contacts_linkcopied1 = /** @type {(inputs: Contacts_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처 링크가 클립보드에 복사되었습니다`)
};

/**
* | output |
* | --- |
* | "Contact link copied to clipboard" |
*
* @param {Contacts_Linkcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_linkcopied1 = /** @type {((inputs?: Contacts_Linkcopied1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Linkcopied1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_linkcopied1(inputs)
	if (locale === "es") return es_contacts_linkcopied1(inputs)
	if (locale === "de") return de_contacts_linkcopied1(inputs)
	if (locale === "ar") return ar_contacts_linkcopied1(inputs)
	if (locale === "fr") return fr_contacts_linkcopied1(inputs)
	return ko_contacts_linkcopied1(inputs)
});
export { contacts_linkcopied1 as "contacts.linkCopied" }