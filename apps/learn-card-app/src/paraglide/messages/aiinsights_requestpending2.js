/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Requestpending2Inputs */

const en_aiinsights_requestpending2 = /** @type {(inputs: Aiinsights_Requestpending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Pending`)
};

const es_aiinsights_requestpending2 = /** @type {(inputs: Aiinsights_Requestpending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud pendiente`)
};

const fr_aiinsights_requestpending2 = /** @type {(inputs: Aiinsights_Requestpending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande en attente`)
};

const ar_aiinsights_requestpending2 = /** @type {(inputs: Aiinsights_Requestpending2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الطلب قيد الانتظار`)
};

/**
* | output |
* | --- |
* | "Request Pending" |
*
* @param {Aiinsights_Requestpending2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_requestpending2 = /** @type {((inputs?: Aiinsights_Requestpending2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Requestpending2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_requestpending2(inputs)
	if (locale === "es") return es_aiinsights_requestpending2(inputs)
	if (locale === "fr") return fr_aiinsights_requestpending2(inputs)
	return ar_aiinsights_requestpending2(inputs)
});
export { aiinsights_requestpending2 as "aiInsights.requestPending" }