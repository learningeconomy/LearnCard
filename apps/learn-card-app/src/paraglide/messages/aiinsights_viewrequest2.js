/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Viewrequest2Inputs */

const en_aiinsights_viewrequest2 = /** @type {(inputs: Aiinsights_Viewrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Request`)
};

const es_aiinsights_viewrequest2 = /** @type {(inputs: Aiinsights_Viewrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver solicitud`)
};

const fr_aiinsights_viewrequest2 = /** @type {(inputs: Aiinsights_Viewrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir la demande`)
};

const ar_aiinsights_viewrequest2 = /** @type {(inputs: Aiinsights_Viewrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الطلب`)
};

/**
* | output |
* | --- |
* | "View Request" |
*
* @param {Aiinsights_Viewrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_viewrequest2 = /** @type {((inputs?: Aiinsights_Viewrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Viewrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_viewrequest2(inputs)
	if (locale === "es") return es_aiinsights_viewrequest2(inputs)
	if (locale === "fr") return fr_aiinsights_viewrequest2(inputs)
	return ar_aiinsights_viewrequest2(inputs)
});
export { aiinsights_viewrequest2 as "aiInsights.viewRequest" }