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

const fr_boost_recipients = /** @type {(inputs: Boost_RecipientsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinataires`)
};

const ar_boost_recipients = /** @type {(inputs: Boost_RecipientsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستلمون`)
};

/**
* | output |
* | --- |
* | "Recipients" |
*
* @param {Boost_RecipientsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_recipients = /** @type {((inputs?: Boost_RecipientsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_RecipientsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_recipients(inputs)
	if (locale === "es") return es_boost_recipients(inputs)
	if (locale === "fr") return fr_boost_recipients(inputs)
	return ar_boost_recipients(inputs)
});
export { boost_recipients as "boost.recipients" }