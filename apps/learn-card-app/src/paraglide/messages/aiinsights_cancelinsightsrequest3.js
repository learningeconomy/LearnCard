/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Cancelinsightsrequest3Inputs */

const en_aiinsights_cancelinsightsrequest3 = /** @type {(inputs: Aiinsights_Cancelinsightsrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel Insights Request`)
};

const es_aiinsights_cancelinsightsrequest3 = /** @type {(inputs: Aiinsights_Cancelinsightsrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar solicitud de Insights`)
};

const fr_aiinsights_cancelinsightsrequest3 = /** @type {(inputs: Aiinsights_Cancelinsightsrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler la demande d'Insights`)
};

const ar_aiinsights_cancelinsightsrequest3 = /** @type {(inputs: Aiinsights_Cancelinsightsrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء طلب الرؤى`)
};

/**
* | output |
* | --- |
* | "Cancel Insights Request" |
*
* @param {Aiinsights_Cancelinsightsrequest3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_cancelinsightsrequest3 = /** @type {((inputs?: Aiinsights_Cancelinsightsrequest3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Cancelinsightsrequest3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_cancelinsightsrequest3(inputs)
	if (locale === "es") return es_aiinsights_cancelinsightsrequest3(inputs)
	if (locale === "fr") return fr_aiinsights_cancelinsightsrequest3(inputs)
	return ar_aiinsights_cancelinsightsrequest3(inputs)
});
export { aiinsights_cancelinsightsrequest3 as "aiInsights.cancelInsightsRequest" }