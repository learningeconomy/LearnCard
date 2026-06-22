/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Confirmcancelrequest3Inputs */

const en_aiinsights_confirmcancelrequest3 = /** @type {(inputs: Aiinsights_Confirmcancelrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to cancel this Insights request?`)
};

const es_aiinsights_confirmcancelrequest3 = /** @type {(inputs: Aiinsights_Confirmcancelrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que deseas cancelar esta solicitud de Insights?`)
};

const fr_aiinsights_confirmcancelrequest3 = /** @type {(inputs: Aiinsights_Confirmcancelrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir annuler cette demande d'Insights ?`)
};

const ar_aiinsights_confirmcancelrequest3 = /** @type {(inputs: Aiinsights_Confirmcancelrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إلغاء طلب الرؤى هذا؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to cancel this Insights request?" |
*
* @param {Aiinsights_Confirmcancelrequest3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_confirmcancelrequest3 = /** @type {((inputs?: Aiinsights_Confirmcancelrequest3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Confirmcancelrequest3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_confirmcancelrequest3(inputs)
	if (locale === "es") return es_aiinsights_confirmcancelrequest3(inputs)
	if (locale === "fr") return fr_aiinsights_confirmcancelrequest3(inputs)
	return ar_aiinsights_confirmcancelrequest3(inputs)
});
export { aiinsights_confirmcancelrequest3 as "aiInsights.confirmCancelRequest" }