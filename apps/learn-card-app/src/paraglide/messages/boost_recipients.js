/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_RecipientsInputs */

const en_boost_recipients = /** @type {(inputs: Boost_RecipientsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipients`)
};

const es_boost_recipients = /** @type {(inputs: Boost_RecipientsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinatarios`)
};

const de_boost_recipients = /** @type {(inputs: Boost_RecipientsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empfänger`)
};

const ar_boost_recipients = /** @type {(inputs: Boost_RecipientsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستلمون`)
};

const fr_boost_recipients = /** @type {(inputs: Boost_RecipientsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinataires`)
};

const ko_boost_recipients = /** @type {(inputs: Boost_RecipientsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수령인`)
};

/**
* | output |
* | --- |
* | "Recipients" |
*
* @param {Boost_RecipientsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_recipients = /** @type {((inputs?: Boost_RecipientsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_RecipientsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_recipients(inputs)
	if (locale === "es") return es_boost_recipients(inputs)
	if (locale === "de") return de_boost_recipients(inputs)
	if (locale === "ar") return ar_boost_recipients(inputs)
	if (locale === "fr") return fr_boost_recipients(inputs)
	return ko_boost_recipients(inputs)
});
export { boost_recipients as "boost.recipients" }