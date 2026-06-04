/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Didcopyfailed2Inputs */

const en_contacts_didcopyfailed2 = /** @type {(inputs: Contacts_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy DID to clipboard`)
};

const es_contacts_didcopyfailed2 = /** @type {(inputs: Contacts_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el DID al portapapeles`)
};

const de_contacts_didcopyfailed2 = /** @type {(inputs: Contacts_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID konnte nicht kopiert werden`)
};

const ar_contacts_didcopyfailed2 = /** @type {(inputs: Contacts_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ DID إلى الحافظة`)
};

const fr_contacts_didcopyfailed2 = /** @type {(inputs: Contacts_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le DID dans le presse-papiers`)
};

const ko_contacts_didcopyfailed2 = /** @type {(inputs: Contacts_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID를 클립보드에 복사할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to copy DID to clipboard" |
*
* @param {Contacts_Didcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_didcopyfailed2 = /** @type {((inputs?: Contacts_Didcopyfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Didcopyfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_didcopyfailed2(inputs)
	if (locale === "es") return es_contacts_didcopyfailed2(inputs)
	if (locale === "de") return de_contacts_didcopyfailed2(inputs)
	if (locale === "ar") return ar_contacts_didcopyfailed2(inputs)
	if (locale === "fr") return fr_contacts_didcopyfailed2(inputs)
	return ko_contacts_didcopyfailed2(inputs)
});
export { contacts_didcopyfailed2 as "contacts.didCopyFailed" }