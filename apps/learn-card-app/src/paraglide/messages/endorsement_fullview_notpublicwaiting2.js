/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Fullview_Notpublicwaiting2Inputs */

const en_endorsement_fullview_notpublicwaiting2 = /** @type {(inputs: Endorsement_Fullview_Notpublicwaiting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not public • Waiting for review`)
};

const es_endorsement_fullview_notpublicwaiting2 = /** @type {(inputs: Endorsement_Fullview_Notpublicwaiting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No público • Esperando revisión`)
};

const fr_endorsement_fullview_notpublicwaiting2 = /** @type {(inputs: Endorsement_Fullview_Notpublicwaiting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non public • En attente d'examen`)
};

const ar_endorsement_fullview_notpublicwaiting2 = /** @type {(inputs: Endorsement_Fullview_Notpublicwaiting2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير عام • في انتظار المراجعة`)
};

/**
* | output |
* | --- |
* | "Not public • Waiting for review" |
*
* @param {Endorsement_Fullview_Notpublicwaiting2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_notpublicwaiting2 = /** @type {((inputs?: Endorsement_Fullview_Notpublicwaiting2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_Notpublicwaiting2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_notpublicwaiting2(inputs)
	if (locale === "es") return es_endorsement_fullview_notpublicwaiting2(inputs)
	if (locale === "fr") return fr_endorsement_fullview_notpublicwaiting2(inputs)
	return ar_endorsement_fullview_notpublicwaiting2(inputs)
});
export { endorsement_fullview_notpublicwaiting2 as "endorsement.fullview.notPublicWaiting" }