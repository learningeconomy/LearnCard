/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_SavingInputs */

const en_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const de_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichern...`)
};

const ar_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...حفظ`)
};

const fr_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

const ko_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저장 중...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Contacts_SavingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_saving = /** @type {((inputs?: Contacts_SavingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_SavingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_saving(inputs)
	if (locale === "es") return es_contacts_saving(inputs)
	if (locale === "de") return de_contacts_saving(inputs)
	if (locale === "ar") return ar_contacts_saving(inputs)
	if (locale === "fr") return fr_contacts_saving(inputs)
	return ko_contacts_saving(inputs)
});
export { contacts_saving as "contacts.saving" }