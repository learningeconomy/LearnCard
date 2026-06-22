/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Insightsrequestreminder3Inputs */

const en_aiinsights_insightsrequestreminder3 = /** @type {(inputs: Aiinsights_Insightsrequestreminder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights Request Reminder`)
};

const es_aiinsights_insightsrequestreminder3 = /** @type {(inputs: Aiinsights_Insightsrequestreminder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recordatorio de solicitud de Insights`)
};

const fr_aiinsights_insightsrequestreminder3 = /** @type {(inputs: Aiinsights_Insightsrequestreminder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rappel de demande d'Insights`)
};

const ar_aiinsights_insightsrequestreminder3 = /** @type {(inputs: Aiinsights_Insightsrequestreminder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تذكير طلب الرؤى`)
};

/**
* | output |
* | --- |
* | "Insights Request Reminder" |
*
* @param {Aiinsights_Insightsrequestreminder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_insightsrequestreminder3 = /** @type {((inputs?: Aiinsights_Insightsrequestreminder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Insightsrequestreminder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_insightsrequestreminder3(inputs)
	if (locale === "es") return es_aiinsights_insightsrequestreminder3(inputs)
	if (locale === "fr") return fr_aiinsights_insightsrequestreminder3(inputs)
	return ar_aiinsights_insightsrequestreminder3(inputs)
});
export { aiinsights_insightsrequestreminder3 as "aiInsights.insightsRequestReminder" }