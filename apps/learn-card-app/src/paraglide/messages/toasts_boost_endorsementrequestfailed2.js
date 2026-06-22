/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Endorsementrequestfailed2Inputs */

const en_toasts_boost_endorsementrequestfailed2 = /** @type {(inputs: Toasts_Boost_Endorsementrequestfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to send endorsement request`)
};

const es_toasts_boost_endorsementrequestfailed2 = /** @type {(inputs: Toasts_Boost_Endorsementrequestfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al enviar la solicitud de respaldo`)
};

const fr_toasts_boost_endorsementrequestfailed2 = /** @type {(inputs: Toasts_Boost_Endorsementrequestfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'envoi de la demande d'approbation`)
};

const ar_toasts_boost_endorsementrequestfailed2 = /** @type {(inputs: Toasts_Boost_Endorsementrequestfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إرسال طلب التأييد`)
};

/**
* | output |
* | --- |
* | "Failed to send endorsement request" |
*
* @param {Toasts_Boost_Endorsementrequestfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_boost_endorsementrequestfailed2 = /** @type {((inputs?: Toasts_Boost_Endorsementrequestfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Endorsementrequestfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_endorsementrequestfailed2(inputs)
	if (locale === "es") return es_toasts_boost_endorsementrequestfailed2(inputs)
	if (locale === "fr") return fr_toasts_boost_endorsementrequestfailed2(inputs)
	return ar_toasts_boost_endorsementrequestfailed2(inputs)
});
export { toasts_boost_endorsementrequestfailed2 as "toasts.boost.endorsementRequestFailed" }